export type TreasuryTokenBalance = {
  id: string;
  chain: string;
  name?: string;
  symbol: string;
  display_symbol?: string;
  optimized_symbol?: string;
  decimals?: number;
  logo_url?: string;
  protocol_id?: string;
  price: number;
  is_core: boolean;
  is_wallet: boolean;
  time_at: number;
  amount: number;
  raw_amount: number;
};

export type StatisticToken = Pick<TreasuryTokenBalance, 'symbol' | 'amount' | 'price' | 'logo_url'> & {value: number; name: string; percent: string};

export type TreasuryStatistic = {
  total: number;
  tokens: StatisticToken[];
}