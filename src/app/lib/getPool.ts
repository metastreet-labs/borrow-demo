"use server";

import { GraphQLClient, gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { zodAddress, zodStringToBigInt } from "./utils";

const SUBGRAPH_URL = `${process.env["SUBGRAPH_URL"]}`;

const GRAPHQL_CLIENT = new GraphQLClient(SUBGRAPH_URL);

const POOL_QUERY = gql`
  query PoolQuery($id: String!) {
    pool(id: $id) {
      id
      durations
      rates
      currencyToken {
        id
        decimals
        symbol
      }
      collateralToken {
        id
      }
      ticks {
        raw
        available
        value
        shares
        redemptionPending
      }
    }
  }
`;

const POOL_SCHEMA = z.object({
  id: zodAddress,
  durations: z.array(z.string().transform((s) => Number(s))),
  rates: z.array(zodStringToBigInt),
  currencyToken: z.object({
    id: zodAddress,
    decimals: z.number(),
    symbol: z.string(),
  }),
  collateralToken: z.object({
    id: zodAddress,
  }),
  ticks: z.array(
    z.object({
      raw: zodStringToBigInt,
      available: zodStringToBigInt,
      value: zodStringToBigInt,
      shares: zodStringToBigInt,
      redemptionPending: zodStringToBigInt,
    }),
  ),
});

export type Pool = z.infer<typeof POOL_SCHEMA>;

export async function getPool(poolAddress: Address) {
  const response = await GRAPHQL_CLIENT.request<any>(POOL_QUERY, { id: poolAddress });
  return POOL_SCHEMA.parse(response.pool);
}
