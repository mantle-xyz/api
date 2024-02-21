import { ExternalAPICallError } from '@/error';
import type {
  TreasuryStatistic,
  TreasuryTokenBalance as TokenBalance,
} from '@/types/treasury-token';
import { sleep } from '@/utils';
import _ from 'lodash';

// docs:
// https://skfc4x16la.larksuite.com/wiki/JjAhwRy9hiw1cykzI26uuxtDsr9?chunked=false
// https://docs.mantle.xyz/governance/parameters/treasury

const coreWallets = [
  // MTreasuryL1	Eth
  '0x78605Df79524164911C144801f41e9811B7DB73D',
  // MTreasuryL2	Mantle
  '0x94FEC56BBEcEaCC71c9e61623ACE9F8e1B1cf473',
  // MTreasuryL1 - SC	Eth
  '0xCa264A4Adf80d3c390233de135468A914f99B6a5',
  // MTreasuryL1 - O1	Eth
  '0xf0e91a74cb053d79b39837E1cfba947D0c98dd93',
  // MTreasuryL1 - E1	Eth
  '0x1a743BD810dde05fa897Ec41FE4D42068F7fD6b2',
  // MTreasuryL1 - RB1	Eth
  '0x164Cf077D3004bC1f26E7A46Ad8fA54df4449E3F',
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

const escpWallets = [
  // ESCP-T-501
  '0x7427b4Fd78974Ba1C3B5d69e2F1B8ACF654fEB44',
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
  {
    symbol: 'USDe',
    name: 'USDe',
    decimals: 18,
    l1Address: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
  },
  {
    symbol: 'sUSDe',
    name: 'Staked USDe',
    decimals: 18,
    l1Address: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
  },
];

const wellKnownTokens = [eth, ...erc20Tokens] as ({
  symbol: string;
  name: string;
} & (
  | { l1Address: string; l2Address?: string }
  | { l1Address?: string; l2Address: string }
))[];

export const cacheTime = 60 * 60; // 1 hour

let cache: TokenBalance[];
let updatedAt = 0;
let fetchPromise: Promise<void> | undefined;

export function getUpdatedAt() {
  return updatedAt;
}

export async function fetchTreasuryTokenList(): Promise<TokenBalance[]> {
  if (!fetchPromise && Date.now() - updatedAt > cacheTime * 1000 - 10_000) {
    fetchPromise = fetchTreasuryTokenListWithoutCache()
      .then((res) => {
        cache = res;
        updatedAt = Date.now();
      })
      .catch((e) => {
        console.error(e);
        if (!cache) throw e;
      })
      .finally(() => {
        fetchPromise = undefined;
      });
  }

  if (!cache) await fetchPromise!;

  return cache;
}

export async function fetchTreasuryTokenListWithoutCache(): Promise<
  TokenBalance[]
> {
  const allWallets = [...coreWallets, ...ecspWallets, ...escpWallets];

  const eth = await Promise.all(
    allWallets.map((w) => fetchTokenList(w, 'eth')),
  );
  await sleep(1000);
  const nmt = await Promise.all(
    allWallets.map((w) => fetchTokenList(w, 'mnt')),
  );
  return [...eth, ...nmt].flat();
  // return Promise.all(
  //   allWallets.flatMap((w) => [
  //     fetchTokenList(w, 'eth'),
  //     fetchTokenList(w, 'mnt'),
  //   ]),
  // ).then((res) => res.flat());
}

export function statisticTreasuryTokenList(): Promise<TreasuryStatistic> {
  return fetchTreasuryTokenList().then(statistics);
}

function statistics(tokens: TokenBalance[]) {
  // merge amount by id
  const tokenMap = tokens.reduce(
    (acc, { id, amount, price, logo_url }) => {
      id = id.toLowerCase();

      if (acc[id]) acc[id].amount += amount;
      else acc[id] = { amount, price, logo_url };

      return acc;
    },
    {} as Record<string, Pick<TokenBalance, 'amount' | 'price' | 'logo_url'>>,
  );

  // merge l1 and l2 token amount
  const tokenBalance = wellKnownTokens.map(
    ({ l1Address, l2Address, symbol, name }) => {
      const t1 = tokenMap[l1Address ?? ''];
      const t2 = tokenMap[l2Address ?? ''];
      const amount = (t1?.amount || 0) + (t2?.amount || 0);
      const t = t1 || t2 || { price: 0 };
      return { ...t, amount, symbol, name };
    },
  );

  // merge MNT and ETH
  const mergeTokens = () => {
    const tokenBySymbol = _.keyBy(tokenBalance, 'symbol');
    const { MNT, WMNT, ETH, WETH, stETH, USDe, sUSDe, ...rest } = tokenBySymbol;
    MNT.amount += WMNT.amount;
    ETH.amount += WETH.amount + stETH.amount;
    USDe.amount += sUSDe.amount;

    return [MNT, ETH, USDe, ...Object.values(rest)];
  };

  const tokensWithValue = mergeTokens().map((t) => ({
    ...t,
    value: t.amount * t.price,
  }));
  const total = _.sumBy(tokensWithValue, 'value');
  const tokensWithPercent = _.sortBy(tokensWithValue, 'value')
    .reverse()
    .map((t) => ({
      ...t,
      percent: ((t.value * 100) / total).toFixed(2) + '%',
    }));
  return { total, tokens: tokensWithPercent };
}

const DEBANK_API_BASE = 'https://pro-openapi.debank.com/v1';

async function fetchTokenList(
  walletAddress: string,
  chain: 'eth' | 'mnt',
): Promise<TokenBalance[]> {
  const tokens = await fetchJSON<TokenBalance[]>(
    `/user/token_list?id=${walletAddress}&chain_id=${chain}&is_all=true`,
  );
  const includeProtocolIds = new Set(tokens.map((t) => t.protocol_id));
  type Protocol = {
    id: string;
    portfolio_item_list: { asset_token_list?: TokenBalance[] }[];
    has_supported_portfolio: boolean;
  };
  const protocolTokens = await fetchJSON<Protocol[]>(
    `/user/complex_protocol_list?id=${walletAddress}&chain_id=${chain}`,
  ).then((protocols) =>
    protocols
      .filter((p) => !includeProtocolIds.has(p.id))
      .flatMap(({ portfolio_item_list, has_supported_portfolio }) =>
        has_supported_portfolio
          ? portfolio_item_list.flatMap((i) => i.asset_token_list ?? [])
          : [],
      ),
  );

  return [...tokens, ...protocolTokens]
    .filter(
      (t: { symbol?: string; amount: number; price: number }) =>
        t.symbol && t.amount && t.price,
    )
    .map((t) => ({ ...t, walletAddress }));
}

function fetchJSON<T = unknown>(path: string): Promise<T> {
  return fetch(`${DEBANK_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      AccessKey: process.env.DEBANK_ACCESSKEY!,
    },
  }).then((res) =>
    res.json().then((data) => {
      if (res.ok) return data;

      throw new ExternalAPICallError(
        'DEBANK',
        `[${data.code}] ${data.message}`,
      );
    }),
  );
}
