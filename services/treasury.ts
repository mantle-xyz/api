import { ExternalAPICallError } from '@/error';
import { TreasuryTokenBalance } from '@/types/treasury-token';

/*
 {
    "id": "0x0000000000085d4780b73119b644ae5ecd22b376",
    "chain": "eth",
    "name": "TrueUSD",
    "symbol": "TUSD",
    "display_symbol": null,
    "optimized_symbol": "TUSD",
    "decimals": 18,
    "logo_url": "https://static.debank.com/image/eth_token/logo_url/0x0000000000085d4780b73119b644ae5ecd22b376/9fedba67e80a738c281bd0ba8e9f1c5e.png",
    "protocol_id": "",
    "price": 1,
    "is_core": true,
    "is_wallet": true,
    "time_at": 1546294558,
    "amount": 21.709487132565773,
    "raw_amount": 21709487132565774000
  }
 */
type TokenBalance = TreasuryTokenBalance;

// docs:
// https://skfc4x16la.larksuite.com/wiki/JjAhwRy9hiw1cykzI26uuxtDsr9?chunked=false
// https://docs.mantle.xyz/governance/parameters/treasury

const coreWallets = [
  // MTreasuryL1	Eth
  ['0x78605Df79524164911C144801f41e9811B7DB73D', 1],
  // MTreasuryL2	Mantle
  ['0x94FEC56BBEcEaCC71c9e61623ACE9F8e1B1cf473', 2],
  // MTreasuryL1 - SC	Eth
  ['0xCa264A4Adf80d3c390233de135468A914f99B6a5', 1],
  // MTreasuryL1 - O1	Eth
  ['0xf0e91a74cb053d79b39837E1cfba947D0c98dd93', 1],
  // MTreasuryL1 - E1	Eth
  ['0x1a743BD810dde05fa897Ec41FE4D42068F7fD6b2', 1],
  // MTreasuryL1 - RB1	Eth
  ['0x164Cf077D3004bC1f26E7A46Ad8fA54df4449E3F', 1],
] as const;

const ecspWallets = [
  // ECSP - T-001	Mantle
  '0xa6b12425F236EE85c6E0E60df9c422C9e603cf80',
  // ECSP - T-002	Mantle
  '0x730D4C348Ba3622E56F1214A825b27C2f6c66169',
  // ECSP - T-003	Mantle
  '0x73904f907A265B1d55b240a85f28a123C33D7255',
  // ECSP - T-004	Mantle
  '0xeFcb810E5C53110436e899f5eaf4D48Fd61278a7',
  // ECSP - T-005	Mantle
  '0xf7cec670917F0AfBD1D08bfbC14FC382CCf28BB7',
  // ECSP - T-006	Mantle
  '0x31645089f6a26E00e36654C74958d1D6C388aC5d',
  // ECSP - T-007	Mantle
  '0xc6Ca545640f24a5b8aACce310Eb2Bca5Bb46aFFB',
  // ECSP - T -008	Mantle
  '0x818a60f490A29E270B6255A36E819f24f7462318',
  // ECSP - T -009	Mantle
  '0x48424b47A48B0Fc9ab998f2337da1Bb8FaFA0Bc0',
  // ECSP - T-010	Mantle
  '0x596b79a977f59D8F282B44102964E49Bd171d9E1',
  // ECSP - T-011	Mantle
  '0xf78BB1fe258c2B3455Df181a40304F5205821E19',
  // ECSP - T-012	Mantle
  '0x47AF3a800AD9834Be4fBC20a91178543F43D2AfE',
  // ECSP - T-013	Mantle
  '0x36D1B05517D8213e590A2531757Fa52705876340',
  // ECSP - T-014	Mantle
  '0x31cCa7bbaCFCE8c70f4D2eAc23758CD60Dfc8bBD',
  // ECSP - T-015	Mantle
  '0xCFf0ac214EeA01F2AaEB02a745464E5Ab205Bf52',
  // ECSP - T-016	Mantle
  '0xC76E84e487dE1dC00b4fC00dcBCAcAE4e0d27BB3',
  // ECSP - T-017	Mantle
  '0x7FF3e7eb4496D09Fbd99D5612AE5B8ef368780fE',
  // ECSP - T -018	Mantle
  '0x37C1231e713CdED0D88a7Eb1bC79A819F3F43494',
  // ECSP - T -019	Mantle
  '0x9df9E4aE30C8c4E0d840259cfd1C5c058D0A9e39',
  // ECSP - T-020	Mantle
  '0xEbAD077F1E61FBbB7EfEb2a991b4eC31Fe72Dd87',
  // ECSP - S-001	Mantle
  '0x87c185bEFFfb36a42b741d10601A007e997a63bA',
  // ECSP - S-002	Mantle
  '0x8AA6a67e96850e070B0c8E94E3a35C5f9f01809C',
  // ECSP-S-003	Mantle
  '0x50f6e426fdefb3f994d3fe9fa4e1ee715f85de7f',
] as const;

/**
 * - MNT: includes L1 MNT, L2 MNT, L2 WMNT, DeFi: UniV3LP MNT
- ETH: includes L1 ETH, L1 WETH, L1stETH, L2 WETH, DeFi: UniV3LP WETH
- wstETH: L1 wstETH, L2 wstETH
- mETH: includes L1 mETH, L2 mETH

USDC/USDT/USDY
 */
const eth = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  coinGeckoId: 'ethereum',
};

const erc20Tokens = [
  {
    symbol: 'MNT',
    name: 'Mantle',
    decimals: 18,
    coinGeckoId: 'mantle',
    l1Address: '0x3c3a81e81dc49A522A592e7622A7E711c06bf354',
    l2Address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
  },
  {
    symbol: 'WMNT',
    name: 'Wrapped MNT',
    decimals: 18,
    coinGeckoId: 'wrapped-mantle',
    l2Address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    coinGeckoId: 'weth',
    l1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    l2Address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
  },
  {
    symbol: 'stETH',
    name: 'stETH',
    decimals: 18,
    coinGeckoId: 'staked-ether',
    l1Address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  },
  {
    symbol: 'wstETH',
    name: 'Wrapped liquid staked Ether 2.0',
    decimals: 18,
    coinGeckoId: 'wrapped-steth',
    l1Address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    l2Address: '0x636D4073738C071326Aa70c9e5DB7C334bEb87bE',
  },
  {
    symbol: 'mETH',
    name: 'mETH',
    decimals: 18,
    coinGeckoId: 'mantle-staked-ether',
    l1Address: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa',
    l2Address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
  },
  {
    symbol: 'USDC',
    name: 'USDC',
    decimals: 6,
    coinGeckoId: 'usd-coin',
    l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    l2Address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    coinGeckoId: 'tether',
    l1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    l2Address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
  },
  {
    symbol: 'USDY',
    name: 'Ondo U.S. Dollar Yield',
    decimals: 18,
    coinGeckoId: 'ondo-us-dollar-yield',
    l1Address: '0x96F6eF951840721AdBF46Ac996b59E0235CB985C',
    l2Address: '0x5bE26527e817998A7206475496fDE1E68957c5A6',
  },
];

const tokens = [eth, ...erc20Tokens];

export const cacheTime = 60 * 60; // 1 hour

let cache: TokenBalance[];
let updatedAt = 0;
let fetchPromise: Promise<void> | undefined;

export async function fetchTreasuryBalanceWithCache(): Promise<TokenBalance[]> {
  if (!fetchPromise && Date.now() - updatedAt > cacheTime * 1000 - 10_000) {
    fetchPromise = fetchTreasuryAssets()
      .then((res) => {
        fetchPromise = undefined;
        cache = res;
        updatedAt = Date.now();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  if (!cache) await fetchPromise!;

  return cache;
}

export function fetchTreasuryAssets(): Promise<TokenBalance[]> {
  const layer1Wallets = coreWallets.filter((w) => w[1] === 1).map((w) => w[0]);
  const layer2Wallets = [
    ...coreWallets.filter((w) => w[1] === 2).map((w) => w[0]),
    ...ecspWallets,
  ];

  return Promise.all([
    ...layer1Wallets.map((w) => fetchTokenList(w, 'eth')),
    ...layer2Wallets.map((w) => fetchTokenList(w, 'mnt')),
  ]).then((res) => res.flat());
}

const DEBANK_API_BASE = 'https://pro-openapi.debank.com/v1';

function fetchTokenList(
  walletAddress: string,
  chain: 'eth' | 'mnt',
): PromiseLike<TokenBalance[]> {
  /* mock
  return Promise.resolve([
    {
      id: '0x0000000000004946c0e9f43f4dee607b0ef1fa1c',
      chain: 'eth',
      name: 'Chi Gastoken by 1inch',
      symbol: 'CHI',
      display_symbol: null,
      optimized_symbol: 'CHI',
      decimals: 0,
      logo_url:
        'https://static.debank.com/image/eth_token/logo_url/0x0000000000004946c0e9f43f4dee607b0ef1fa1c/5d763d01aae3f0ac9a373564026cb620.png',
      protocol_id: '1inch',
      price: 0,
      is_core: true,
      is_wallet: true,
      time_at: 1590352004,
      amount: 3,
      raw_amount: 3,
    },
    {
      id: '0x0000000000085d4780b73119b644ae5ecd22b376',
      chain: 'eth',
      name: 'TrueUSD',
      symbol: 'TUSD',
      display_symbol: null,
      optimized_symbol: 'TUSD',
      decimals: 18,
      logo_url:
        'https://static.debank.com/image/eth_token/logo_url/0x0000000000085d4780b73119b644ae5ecd22b376/9fedba67e80a738c281bd0ba8e9f1c5e.png',
      protocol_id: '',
      price: 1,
      is_core: true,
      is_wallet: true,
      time_at: 1546294558,
      amount: 21.709487132565773,
      raw_amount: 21709487132565774000,
    },
  ]);
     */
  return fetch(
    `${DEBANK_API_BASE}/user/token_list?id=${walletAddress}&chain_id=${chain}&is_all=true`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        AccessKey: process.env.DEBANK_ACCESSKEY!,
      },
    },
  ).then((res) =>
    res.json().then((data) => {
      if (res.ok)
        return data.filter(
          (t: { symbol?: string; amount: number }) => t.symbol && t.amount,
        );

      throw new ExternalAPICallError(
        'DEBANK',
        `[${data.code}] ${data.message}`,
      );
    }),
  );
}
