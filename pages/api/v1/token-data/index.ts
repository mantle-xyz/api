import { NextApiRequest, NextApiResponse } from 'next';

import { TOKEN_CONTRACT_ADDRESS } from 'config/general';
import { erc20Abi, createPublicClient, http, formatEther } from 'viem';
import { mainnet, mantle } from 'viem/chains';

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

// get the total supply by reasing the contract state
const getTotalSupply = async (alchemy: string) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemy}`),
  });

  return client.readContract({
    address: TOKEN_CONTRACT_ADDRESS,
    functionName: 'totalSupply',
    abi: erc20Abi,
  });
};

function getTreasuryBalance(alchemyKey: string) {
  const l1Wallets = [
    '0x78605Df79524164911C144801f41e9811B7DB73D',
    '0xCa264A4Adf80d3c390233de135468A914f99B6a5',
    '0xf0e91a74cb053d79b39837E1cfba947D0c98dd93',
    '0x1a743BD810dde05fa897Ec41FE4D42068F7fD6b2',
    '0x164Cf077D3004bC1f26E7A46Ad8fA54df4449E3F',
    '0xA5b79541548ef2D48921F63ca72e4954e50a4a74',
    '0x34cAfA03D9750124102059eE35619A9C5D5aF7df',
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
    chain: mantle,
    transport: http(process.env.L2_RPC || 'https://rpc.mantle.xyz'),
  });

  return Promise.all([
    ...l1Wallets.map((address) =>
      l1Client
        .readContract({
          address: TOKEN_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })
        .then((balance) => ({
          address,
          balance,
          chain: 'ethereum',
        })),
    ),

    ...l2Wallets.map((address) =>
      l2Client.getBalance({ address }).then((balance) => ({
        address,
        balance,
        chain: 'mantle',
      })),
    ),
  ]);
}

export const dataHandler = async (alchemyApi: string) => {
  const [totalSupply, treasuryDetail] = await Promise.all([
    getTotalSupply(alchemyApi),
    getTreasuryBalance(alchemyApi),
  ]);

  const treasuryBalance = treasuryDetail.reduce(
    (acc, curr) => acc + curr.balance,
    0n,
  );

  return {
    totalSupply: formatEther(totalSupply),
    circulatingSupply: formatEther(totalSupply - treasuryBalance),
    treasuryBalance: formatEther(treasuryBalance),
    treasuryDetail: treasuryDetail.map(({ address, balance, chain }) => ({
      address,
      balance: formatEther(balance),
      chain,
    })),
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
        message: 'alchemyApi not provided',
      });
    }
    const query = req.query.q;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    if (req.method == 'OPTIONS') {
      res.setHeader(
        'Access-Control-Allow-Methods',
        'PUT, POST, PATCH, DELETE, GET',
      );
      return res.status(200).json({});
    }

    // get the result body from the dataHandler
    const results = await dataHandler(alchemyApi as string);

    res.setHeader(
      'Cache-Control',
      `s-maxage=${CACHE_TIME}, stale-while-revalidate=${2 * CACHE_TIME}`,
    );

    if (query) {
      const dataFilter = results[query as keyof typeof results];
      const result =
        dataFilter && typeof dataFilter === 'string'
          ? Number(dataFilter)
          : dataFilter;

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
