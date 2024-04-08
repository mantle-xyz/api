import {
  Alchemy,
  Network,
  TokenBalance,
  TokenBalancesResponse,
} from "alchemy-sdk";
import { NextApiRequest, NextApiResponse } from "next";

import {
  BITDAO_LOCKED_ADDRESSES,
  BITDAO_LP_WALLET_ADDRESS,
  MANTLE_CORE_WALLET_ADDRESS,
  MANTLE_TREASURY_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from "config/general";
import { createPublicClient, defineChain, formatUnits, http } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * @swagger
 * /token-data:
 *  get:
 *    tags: [Balance]
 *    summary: Get MNT data
 *
 *    description: |-
 *      **Returns MNT supply data**
 *
 *    parameters:
 *    - name: alchemyApi
 *      in: query
 *      required: true
 *
 *    responses:
 *
 *      200:
 *        description: token data
 *        content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenBalances'
 *
 *      500:
 *        description: alchemyApi not provided
 *        success: false
 *        statusCode: 500
 *        message: alchemyApi not provided
 */
const CACHE_TIME = 1800;
const alchemySettings = {
  apiKey: '', // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
};

// get the total supply by reasing the contract state
const getTotalSupply = async (alchemy?: Alchemy) => {
  // Example reading from a contract directly...
  // const provider = await alchemy.config.getProvider();
  const client = createPublicClient({
    chain: mainnet,
    transport: http(
      `https://eth-mainnet.g.alchemy.com/v2/${
        alchemy?.config.apiKey || process.env.ALCHEMY_API_KEY
      }`,
    ),
  });

  // const abi = parseAbi([
  //   "function totalSupply() view returns (uint256)",
  // ] ) ;

  const abi = <const>[
    {
      name: 'totalSupply',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
  ];
  // [
  //   {address:TOKEN_CONTRACT_ADDRESS}
  // ];

  // const erc20 = new Contract(TOKEN_CONTRACT_ADDRESS, abi, provider);
  const erc20 = await client.readContract({
    address: TOKEN_CONTRACT_ADDRESS,
    functionName: 'totalSupply',
    abi: abi,
  });

  return formatUnits(erc20, 18).toString();
};

// subtract locked funds from totalSupplu
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCirculatingSupply = (
  totalSupply: string,
  mantleCoreTotal: number,
  treasuryBalanceTotal: number,
  treasuryLPTokenTotal: number,
  lockedTotal: number,
) => {
  // take any BIT not in the circulating supply away from totalSupply
  return `${
    parseFloat(totalSupply) -
    mantleCoreTotal -
    treasuryBalanceTotal -
    treasuryLPTokenTotal -
    lockedTotal
  }`;
};

function getTreasuryBalance(alchemyKey: string) {
  const l1Wallets = [
    '0x78605Df79524164911C144801f41e9811B7DB73D',
    '0xCa264A4Adf80d3c390233de135468A914f99B6a5',
    '0xf0e91a74cb053d79b39837E1cfba947D0c98dd93',
    '0x1a743BD810dde05fa897Ec41FE4D42068F7fD6b2',
    '0x164Cf077D3004bC1f26E7A46Ad8fA54df4449E3F',
    '0xA5b79541548ef2D48921F63ca72e4954e50a4a74',
  ] as const;
  const l2Wallets = [
    '0x94FEC56BBEcEaCC71c9e61623ACE9F8e1B1cf473',
    '0x87C62C3F9BDFc09200bCF1cbb36F233A65CeF3e6',
    '0x992b65556d330219e7e75C43273535847fEee262',
    '0xcD9Dab9Fa5B55EE4569EdC402d3206123B1285F4',
  ] as const;
  const l1Client = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
  });

  const l2Client = createPublicClient({
    chain: defineChain({
      id: 5000,
      name: 'Mantle Mainnet',
      network: 'Mantle Mainnet',
      nativeCurrency: {
        name: 'Mantle',
        symbol: 'MNT',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [process.env.L2_RPC || 'https://rpc.mantle.xyz'],
        },
        public: {
          http: [process.env.L2_RPC || 'https://rpc.mantle.xyz'],
        },
      },
      blockExplorerUrls: ['https://explorer.mantle.xyz/'],
    }),
    transport: http(process.env.L2_RPC || 'https://rpc.mantle.xyz'),
  });

  const abi = [
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  return Promise.all([
    ...l1Wallets.map((address) =>
      l1Client.readContract({
        address: TOKEN_CONTRACT_ADDRESS,
        functionName: 'balanceOf',
        abi: abi,
        args: [address],
      }),
    ),

    ...l2Wallets.map((address) => l2Client.getBalance({ address })),
  ]).then((amounts) =>
    formatUnits(
      amounts.reduce((p, c) => p + c),
      18,
    ),
  );
}

// returns the actual balance held within the TokenBalancesResponse
const getBalance = (balance: TokenBalancesResponse) => {
  return parseFloat(balance.tokenBalances[0].tokenBalance || '0');
};

// retrieve balance data for TOKEN_CONTRACT_ADDRESS given EOA address
const getBalances = async (alchemy: Alchemy, address: string) => {
  const balances = await alchemy.core.getTokenBalances(address, [
    TOKEN_CONTRACT_ADDRESS,
  ]);

  // normalise each of the discovered balances
  balances.tokenBalances = balances.tokenBalances.map(
    (balance: TokenBalance) => {
      // format to ordinary value (to BIT)
      balance.tokenBalance = formatUnits(
        BigInt(balance.tokenBalance || 0),
        18,
      ).toString();

      return balance;
    },
  );

  return balances;
};

// get the results using the alchemyApi key provided
export const dataHandler = async (alchemyApi: string) => {
  alchemySettings.apiKey = String(alchemyApi);

  const alchemy = new Alchemy(alchemySettings);

  // get all async calls in parallel
  const [
    totalSupply,
    mantleCoreData,
    treasuryBalanceData,
    treasuryLPBalanceData,
    treasuryBalance,
    // collect up all other addresses into an array (this represents anything passed in BITDAO_LOCKED_ADDRESSES)
    ...lockedBalancesData
  ] = await Promise.all([
    getTotalSupply(alchemy),
    getBalances(alchemy, MANTLE_CORE_WALLET_ADDRESS),
    getBalances(alchemy, MANTLE_TREASURY_ADDRESS),
    getBalances(alchemy, BITDAO_LP_WALLET_ADDRESS),
    getTreasuryBalance(alchemy.config.apiKey),
    // get balance from each of the locked addresses
    ...BITDAO_LOCKED_ADDRESSES.map(async (address) =>
      getBalances(alchemy, address),
    ),
  ]);

  // extract the total from each of the balanceData structs
  const mantleCoreTotal = getBalance(mantleCoreData);
  const treasuryBalanceTotal = getBalance(treasuryBalanceData);
  const treasuryLPTokenTotal = getBalance(treasuryLPBalanceData);

  // sum all balances in the list of locked addresses
  const lockedTotal = lockedBalancesData.reduce(
    (total: number, balance: TokenBalancesResponse) =>
      total + getBalance(balance),
    0,
  );

  // construct results
  return {
    totalSupply,
    mantleCoreData,
    treasuryBalanceData,
    treasuryLPBalanceData,
    lockedBalancesData,
    // clean totals as strings....
    mantleCoreTotal: `${mantleCoreTotal}`,
    treasuryBalanceTotal: `${treasuryBalanceTotal}`,
    treasuryLPTokenTotal: `${treasuryLPTokenTotal}`,
    lockedTotal: `${lockedTotal}`,
    // totalSupply with all locked/burned totals subtracted
    circulatingSupply: (
      parseFloat(totalSupply) - parseFloat(treasuryBalance)
    ).toString(),
    // circulatingSupply: getCirculatingSupply(
    //   totalSupply,
    //   mantleCoreTotal,
    //   treasuryBalanceTotal,
    //   treasuryLPTokenTotal,
    //   lockedTotal,
    // ),
  };
};

// exporting nextjs req handler as default
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const alchemyApi =
      req.query.alchemyApi || (process.env.ALCHEMY_API_KEY as string);
    if (!alchemyApi) {
      return res.json({
        success: false,
        statusCode: 500,
        message: "alchemyApi not provided",
      });
    }
    const query = req.query.q;
    console.log("query", req.query.q);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method == "OPTIONS") {
      res.setHeader(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }

    // get the result body from the dataHandler
    const results = await dataHandler(alchemyApi as string);

    res.setHeader(
      "Cache-Control",
      `s-maxage=${CACHE_TIME}, stale-while-revalidate=${2 * CACHE_TIME}`
    );

    if (query) {
      const dataFilter = results[query as keyof typeof results];
      const result:
        | string
        | number
        | TokenBalancesResponse
        | TokenBalancesResponse[] =
        dataFilter && typeof dataFilter === "string"
          ? Number(dataFilter)
          : dataFilter;
      console.log("result", result);
      if (result) return res.json(result);
    }
    res.json({
      success: true,
      statusCode: 200,
      results: results,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, statusCode: 500, message: error?.message });
  }
};

export default handler;
