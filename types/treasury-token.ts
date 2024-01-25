type TreasuryTokenCommon = {
  symbol: string;
  logo_url?: string;
  price: number;
  amount: number;
};

export type TreasuryTokenBalance = TreasuryTokenCommon & {
  id: string;
  chain: string;
  name?: string;
  display_symbol?: string;
  optimized_symbol?: string;
  decimals?: number;
  protocol_id?: string;
  is_core: boolean;
  is_wallet: boolean;
  time_at: number;
  raw_amount: number;
};

export type StatisticToken = TreasuryTokenCommon & {value: number; name: string; percent: string};

export type TreasuryStatistic = {
  total: number;
  tokens: StatisticToken[];
}