// Bind ID against the TOKEN_CONTRACT_ADDRESS
import { TOKEN_CONTRACT_ADDRESS } from "@/config/general";

// Map data exposed in this endpoint to graphql entities
import { dataHandler as TokenBalance } from "../../token-data";

// simple holders type (shouldnt need this anywhere else)
type Holders = {
  id: string;
  name: string;
  token: string;
  tokenBalance: string | null;
};

// map TokenBalance entries into the holder entities and record TokenBalance entry for summary
export const mapTokenBalanceData = async (tokens: { address: string }[]) => {
  // wrap in a try catch to avoid 500 error
  try {
    // get the balance data
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const _tokenBalances = await TokenBalance(process.env.ALCHEMY_API_KEY!);

    // construct holders from mapped content
    const holders: Holders[] = [];

    // construct new tokenBalances data
    const tokenBalances = [
      {
        id: TOKEN_CONTRACT_ADDRESS,
        name: 'MNT',
        token: TOKEN_CONTRACT_ADDRESS,
        address: TOKEN_CONTRACT_ADDRESS,
        totalSupply: _tokenBalances.totalSupply,
        circulatingSupply: _tokenBalances.circulatingSupply,
        lockedTotal: '0',
        balanceTotal: _tokenBalances.treasuryBalance,
        LPTokenTotal: '0',
        mantleCoreTotal: '0',
      },
    ];

    // return the mapped entities
    return {
      tokens,
      holders,
      tokenBalances,
    };
  } catch {
    // return empty mapping
    return {
      tokens,
      holders: [],
      tokenBalances: [],
    };
  }
};
