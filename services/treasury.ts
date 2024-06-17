import { ExternalAPICallError } from '@/error';
import type {
  TreasuryStatistic,
  TreasuryTokenBalance as TokenBalance,
} from '@/types/treasury-token';
import fetchTreasuryWallets from '@/utils/governance-wallets';
import _ from 'lodash';
import pThrottle from 'p-throttle';

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

const EigenLayerETH = {
  symbol: 'EigenLayerETH',
  name: 'EigenLayer',
  decimals: 18,
  l1Address: 'eigen-layer-eth',
};
const USDeLocked = {
  symbol: 'USDeLocked',
  name: 'USDe Locked',
  decimals: 18,
  l1Address: 'ethena-farming-usde',
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
  // amount is zero
  // {
  //   symbol: 'wstETH',
  //   name: 'Wrapped liquid staked Ether 2.0',
  //   decimals: 18,
  //   coinGeckoId: 'wrapped-steth',
  //   l1Address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  //   l2Address: '0x636d4073738c071326aa70c9e5db7c334beb87be',
  // },
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

const wellKnownTokens = [eth, EigenLayerETH, USDeLocked, ...erc20Tokens] as ({
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
  const allWallets = await fetchTreasuryWallets();

  const eth = await Promise.all(
    allWallets.map((w) => fetchTokenList(w, 'eth')),
  );
  const mnt = await Promise.all(
    allWallets.map((w) => fetchTokenList(w, 'mnt')),
  );
  return [...eth, ...mnt].flat();
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

const fetchMETHtoETH = withCache(fetchMETH, 60 * 60 * 1000);
async function statistics(tokens: TokenBalance[]) {
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

  const mETHtoETH = await fetchMETHtoETH();

  // merge MNT and ETH
  const mergeTokens = () => {
    const tokenBySymbol = _.keyBy(tokenBalance, 'symbol');
    const {
      EigenLayerETH,
      USDeLocked,
      MNT,
      WMNT,
      ETH,
      WETH,
      stETH,
      USDe,
      // sUSDe,
      ...rest
    } = tokenBySymbol;
    MNT.amount += WMNT.amount;
    ETH.amount += WETH.amount + stETH.amount;
    // USDe.amount += sUSDe.amount;

    EigenLayerETH.amount = EigenLayerETH.amount / Number(mETHtoETH);

    return [
      _.assign(
        EigenLayerETH,
        _.pick(
          rest.mETH,
          'price',
          'is_core',
          'is_wallet',
          'decimals',
          'symbol',
        ),
      ),
      {
        ...USDeLocked,
        symbol: USDe.symbol,
      },
      MNT,
      ETH,
      USDe,
      ...Object.values(rest),
    ];
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
  const allTokens = await fetchDebank<TokenBalance[]>(
    `/user/token_list?id=${walletAddress}&chain_id=${chain}&is_all=true`,
  );
  const tokens = allTokens.filter(
    (t) => ['mETH', 'sUSDe'].includes(t.symbol) || t.is_wallet,
  );

  type Protocol = {
    id: string;
    logo_url?: string;
    portfolio_item_list: {
      asset_token_list?: TokenBalance[];
      pool?: {
        id: '0x8707f238936c12c309bfc2b9959c35828acfc512';
        chain: 'eth';
        project_id: 'ethena';
        adapter_id?: 'ethena_farming';
        controller: '0x8707f238936c12c309bfc2b9959c35828acfc512';
        index: null;
        time_at: 1704821171;
      };
      detail?: { description?: string };
      name: string;
    }[];
    has_supported_portfolio: boolean;
  };
  const protocolTokens = await fetchDebank<Protocol[]>(
    `/user/complex_protocol_list?id=${walletAddress}&chain_id=${chain}`,
  ).then((protocols) => {
    // if (
    //   walletAddress.toLocaleLowerCase() ===
    //   '0x1a743bd810dde05fa897ec41fe4d42068f7fd6b2'
    // ) {
    //   console.log(JSON.stringify(protocols, null, 2), allTokens);
    // }

    return protocols.flatMap(
      ({
        id,
        logo_url,
        portfolio_item_list: allItems,
        has_supported_portfolio,
      }) => {
        if (!has_supported_portfolio) return [];

        const portfolio_item_list = allItems.filter(
          (i) =>
            !['mETH', 'sUSDe'].includes(i.detail?.description as string) ||
            i.name !== 'Staked',
        );

        if (
          walletAddress.toLocaleLowerCase() ===
            '0x1a743bd810dde05fa897ec41fe4d42068f7fd6b2' &&
          id === 'ethena'
        ) {
          return portfolio_item_list.flatMap((i) =>
            (i.asset_token_list ?? []).map((t) => {
              if (
                t.symbol === 'USDe' &&
                i.pool?.adapter_id === 'ethena_farming'
              ) {
                return {
                  ...t,
                  id: 'ethena-farming-usde',
                  name: USDeLocked.name,
                  symbol: USDeLocked.symbol,
                } as TokenBalance;
              }

              return t;
            }),
          );
        }
        if (id === 'eigenlayer') {
          return portfolio_item_list
            .flatMap((i) => i.asset_token_list ?? [])
            .map((t) => {
              if (t.symbol !== 'ETH') return t;
              return {
                ...t,
                id: 'eigen-layer-eth',
                name: 'EigenLayer',
                symbol: 'EigenLayerETH',
                logo_url,
              } as TokenBalance;
            });
        }
        return portfolio_item_list.flatMap((i) => i.asset_token_list ?? []);
      },
    );
  });

  return [...tokens, ...protocolTokens]
    .filter(
      (t: { symbol?: string; amount: number; price: number }) =>
        t.symbol && t.amount && t.price,
    )
    .map((t) => ({ ...t, walletAddress }));
}

function fetchMETH<T = unknown>(): Promise<T> {
  return fetch('https://meth.mantle.xyz/api/stats/apy?limit=1&offset=0', {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  }).then((res) =>
    res.json().then((data) => {
      if (res.ok) return data.data[0].METHtoETH;

      throw new ExternalAPICallError(
        'mETH_API',
        `[${data.code}] ${data.message}`,
      );
    }),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withCache<F extends (...args: any[]) => Promise<any>>(
  task: F,
  cacheTime: number,
): F {
  let cache: ReturnType<F>;
  let updatedAt = 0;
  let taskPromise: Promise<void> | undefined;

  return (async (...params) => {
    if (!taskPromise && Date.now() - updatedAt > cacheTime) {
      taskPromise = task(...params)
        .then((res) => {
          cache = res;
          updatedAt = Date.now();
        })
        .catch((e) => {
          console.error(e);
          if (!cache) throw e;
        })
        .finally(() => {
          taskPromise = undefined;
        });
    }

    if (!cache) await taskPromise!;

    return cache;
  }) as F;
}

const throttle = pThrottle({ limit: 50, interval: 1000 })(() => {});

async function fetchDebank<T = unknown>(path: string): Promise<T> {
  await throttle();
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
