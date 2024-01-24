import { fetchTreasuryBalanceWithCache } from '@/services/treasury';
import { createSchema, createYoga } from 'graphql-yoga';

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      treasury: [TokenBalance!]!
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
  `,
  resolvers: {
    Query: {
      treasury: fetchTreasuryBalanceWithCache,
    },
  },
});

// Create a Yoga instance with a GraphQL schema.
const yoga = createYoga({
  graphqlEndpoint: '/api/v2/graphql',
  schema,
});

export default yoga;
