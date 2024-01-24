import { ExternalAPICallError } from '@/error';
import { StatisticToken, TreasuryStatistic, TreasuryTokenBalance } from '@/types/treasury-token';
import _ from 'lodash';

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
  l1Address: 'eth',
};

const erc20Tokens = [
  {
    symbol: 'MNT',
    name: 'Mantle',
    decimals: 18,
    coinGeckoId: 'mantle',
    l1Address: '0x3c3a81e81dc49a522a592e7622a7e711c06bf354',
    l2Address: 'mnt',
  },
  {
    symbol: 'WMNT',
    name: 'Wrapped MNT',
    decimals: 18,
    coinGeckoId: 'wrapped-mantle',
    l2Address: '0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    coinGeckoId: 'weth',
    l1Address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    l2Address: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111',
  },
  {
    symbol: 'stETH',
    name: 'stETH',
    decimals: 18,
    coinGeckoId: 'staked-ether',
    l1Address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  },
  {
    symbol: 'wstETH',
    name: 'Wrapped liquid staked Ether 2.0',
    decimals: 18,
    coinGeckoId: 'wrapped-steth',
    l1Address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    l2Address: '0x636d4073738c071326aa70c9e5db7c334beb87be',
  },
  {
    symbol: 'mETH',
    name: 'mETH',
    decimals: 18,
    coinGeckoId: 'mantle-staked-ether',
    l1Address: '0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa',
    l2Address: '0xcda86a272531e8640cd7f1a92c01839911b90bb0',
  },
  {
    symbol: 'USDC',
    name: 'USDC',
    decimals: 6,
    coinGeckoId: 'usd-coin',
    l1Address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    l2Address: '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    coinGeckoId: 'tether',
    l1Address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    l2Address: '0x201eba5cc46d216ce6dc03f6a759e8e766e956ae',
  },
  {
    symbol: 'USDY',
    name: 'Ondo U.S. Dollar Yield',
    decimals: 18,
    coinGeckoId: 'ondo-us-dollar-yield',
    l1Address: '0x96f6ef951840721adbf46ac996b59e0235cb985c',
    l2Address: '0x5be26527e817998a7206475496fde1e68957c5a6',
  },
];

const wellKnownTokens = [eth, ...erc20Tokens] as ({symbol: string; name: string} & ({l1Address: string; l2Address?: string} | {l1Address?: string; l2Address: string}))[];

export const cacheTime = 60 * 60; // 1 hour

let cache: TokenBalance[];
let updatedAt = 0;
let fetchPromise: Promise<void> | undefined;

export async function fetchTreasuryTokenList(): Promise<TokenBalance[]> {
  if (!fetchPromise && Date.now() - updatedAt > cacheTime * 1000 - 10_000) {
    fetchPromise = fetchTreasuryTokenListWithoutCache()
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

export function fetchTreasuryTokenListWithoutCache(): Promise<TokenBalance[]> {
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

export function statisticTreasuryTokenList(): Promise<TreasuryStatistic> {
  return fetchTreasuryTokenList().then(statistics);
}

function statistics(tokens: TokenBalance[]) {
    // merge amount by id
    const tokenMap = tokens.reduce((acc, { id, amount, price, logo_url }) => {
        id = id.toLowerCase();

        if (acc[id]) acc[id].amount += amount;
        else acc[id] = { amount, price, logo_url };

        return acc;
    }, {} as Record<string, Pick<TokenBalance, 'amount' | 'price' | 'logo_url'>>);

    // merge l1 and l2 token amount
    const tokenBalance = wellKnownTokens.map(({ l1Address, l2Address, symbol, name }) => {
        const t1 = tokenMap[l1Address ?? ''];
        const t2 = tokenMap[l2Address ?? ''];
        const amount = (t1?.amount || 0) + (t2?.amount || 0);
        const t = t1 || t2;
        return { ...t, amount, symbol, name };
    });

    // merge MNT and ETH
    const mergeTokens = () => {
        const tokenBySymbol = _.keyBy(tokenBalance, 'symbol');
        const { MNT, WMNT, ETH, WETH, stETH, ...rest } = tokenBySymbol;
        MNT.amount += WMNT.amount;
        ETH.amount += WETH.amount + stETH.amount;

        return [MNT, ETH, ...Object.values(rest)];
    };

    const tokensWithValue = mergeTokens().map(t => ({ ...t, value: t.amount * t.price }));
    const total = _.sumBy(tokensWithValue, 'value');
    const tokensWithPercent = _.sortBy(tokensWithValue, 'value').map(t => ({ ...t, percent: ((t.value * 100 / total)).toFixed(2) + '%' }));
    return { total, tokens: tokensWithPercent };
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
