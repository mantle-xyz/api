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
  // MTreasuryL1-LPE1 ETH
  '0xA5b79541548ef2D48921F63ca72e4954e50a4a74',
  // MTreasuryL2-RB2 Mantle
  '0x87C62C3F9BDFc09200bCF1cbb36F233A65CeF3e6',
  // MTreasuryL2-LPM1 Mantle
  '0x992b65556d330219e7e75C43273535847fEee262',
  // MTreasuryL2-FF1 Mantle
  '0xcD9Dab9Fa5B55EE4569EdC402d3206123B1285F4',
] as const;

const ecspWallets = [
  '0x87c185bEFFfb36a42b741d10601A007e997a63bA',
  '0x8AA6a67e96850e070B0c8E94E3a35C5f9f01809C',
  '0x50f6e426fdefb3f994d3fe9fa4e1ee715f85de7f',
  '0x7427b4Fd78974Ba1C3B5d69e2F1B8ACF654fEB44',
  '0x7fe2bAffD481a8776A9eaD15a8eD17Fe37107903',
  '0x15Bb5D31048381c84a157526cEF9513531b8BE1e',
  '0xdD1c2483056fF46153249bd903401ae7bF6360D1',
  '0x565F603D583F9199487923775114ae8c0D17D044',
  '0x650aD9e7EfCD34B7d050c22a6A8dFFAFe3B4A22E',
  '0x607105cE5bf13e70B49E949a3DdFaD694d19374F',
  '0x131C7f3461A6696317ddfEdfed3BCdc10A2062B2',
  '0xa1F7D91Bf121f4940d96c5C52Bc577011B95B51b',
  '0x911169AA285f5D18fC3567d150616d4B0869d3a5',
  '0x3f946F00A00eB2A66A4BD1AeAF137E05dB6CAEc6',
  '0x9fe09b3ed1A407162876fEB1995048A620552fD0',
  '0xd4338fC8Dc9d2FDcb99604d3cFc80019EBE01058',
  '0x71Fb53Afc7E36C3f11BC1bdBBAB7B6FC3E552eb6',
  '0x92A9e359d72F934a5d7c1251201f9855A381B23c',
  '0xb118d4B94B0D4ce38F0D15d88f1dC09580a60b7A',
  '0xaA42736947d1fdcc5d93F459A6D1dC0d7b9a92a4',
  '0xF366eC9FA2DCE0ee7A6bdae4Aaa5c076E8391AFC',
  '0x5DA939F5e2bC3C7159ac16f98BbFb23759000cd5',
  '0x60F6ce1965D99EEffDF63B5303664f25fCb0347F',
  '0xC784F3aEA5ce3daBA6907ee5d6Ce321a204Eb3A8',
  '0xDCA65E2DFEe70991374eD47EfB4aD6B4FCD0c612',
  '0x4ea7b4D10a01c93509BaA0CBb128c89344A1F578',
  '0x4dF3d780Af7cbD51d9c76f236477edF417c7B554',
  '0xA38e519b12D9CE133396a3E4EB92aac0934AB351',
  '0x6d9755211D627fe0EA02D94C23C6110af16a8882',
  '0x43c0f24E84e6d45b021d18C982beAbFA969577c8',
  '0xB82C91bB7e8696a4A057192ED61aFcD1F9121722',
  '0x15FFBf5730FA9eF271B2E9b4a1a6c90F2288155B',
  '0xCef70f66e50CF016BB932De6425AA6f7286A3886',
  '0x50165383783124232B9e4367D59815947012Ac27',
  '0x97D50c7d14E68bEBC0f81B4FdCed89a1122330A6',
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

function fetchDebank<T = unknown>(path: string): Promise<T> {
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
