import { fetchTreasuryTokenList, statisticTreasuryTokenList } from '@/services/treasury';
import { createSchema, createYoga } from 'graphql-yoga';

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      treasuryTokens: [TokenBalance!]!
      treasuryStatistics: Statistics!
    }

    type TokenBalance {
      id: ID!
      chain: String!
      name: String
      symbol: String!
      display_symbol: String
      optimized_symbol: String
      decimals: Int
      logo_url: String
      protocol_id: String
      price: Float!
      is_core: Boolean!
      is_wallet: Boolean!
      time_at: Int!
      amount: Float!
      raw_amount: Int!
    }

    type StatisticsToken {
        symbol: String!
        name: String!
        amount: Float!
        price: Float!
        value: Float!
        percent: String!
        logo_url: String
    }

    type Statistics {
        total: Float!
        tokens: [StatisticsToken!]!
    }
  `,
  resolvers: {
    Query: {
      treasuryTokens: fetchTreasuryTokenList,
      treasuryStatistics: statisticTreasuryTokenList,
    },
  },
});

// Create a Yoga instance with a GraphQL schema.
const yoga = createYoga({
  graphqlEndpoint: '/api/v2/graphql',
  schema,
});

export default yoga;
