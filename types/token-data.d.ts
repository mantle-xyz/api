export interface TokenBalances {
  success: boolean;
  statusCode: number;
  results: TokenBalancesResults;
}
export interface TokenBalancesResults {
  totalSupply: string;
  circulatingSupply: string;
  treasuryBalance: string;
  treasuryDetail: {
    address: string;
    balance: string;
    chain: string;
  }[];
}
