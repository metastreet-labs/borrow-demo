"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { zodAddress, zodHex, zodStringToBigInt } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

const DEPOSITS_QUERY = gql`
  query Deposits($pool: String!, $account: Bytes!) {
    deposits(where: { pool: $pool, account: $account }) {
      id
      shares
      pool {
        id
        currencyToken {
          id
          symbol
          decimals
        }
        durations
        rates
        ticks {
          raw
        }
      }
      tick {
        raw
      }
      redemptions {
        redemptionId
        shares
      }
    }
  }
`;

const DEPOSITS_SCHEMA = z.array(
  z.object({
    id: zodHex,
    shares: zodStringToBigInt,
    pool: z.object({
      id: zodAddress,
      currencyToken: z.object({
        id: zodAddress,
        symbol: z.string(),
        decimals: z.number(),
      }),
      durations: z.array(z.string().transform((s) => Number(s))),
      rates: z.array(zodStringToBigInt),
      ticks: z.array(
        z.object({
          raw: zodStringToBigInt,
        }),
      ),
    }),
    tick: z.object({
      raw: zodStringToBigInt,
    }),
    redemptions: z.array(
      z.object({
        redemptionId: zodStringToBigInt,
        shares: zodStringToBigInt,
      }),
    ),
  }),
);

export type Deposit = z.infer<typeof DEPOSITS_SCHEMA>[number];

type GetDepositsParams = {
  chainId: number;
  pool: Address;
  account: Address;
};

export async function getDeposits(params: GetDepositsParams) {
  const { chainId, ...variables } = params;
  const response = await getGQLClient(chainId).request<any>(DEPOSITS_QUERY, variables);
  return DEPOSITS_SCHEMA.parse(response.deposits);
}
