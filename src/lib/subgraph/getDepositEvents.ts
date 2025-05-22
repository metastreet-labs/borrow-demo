"use server";

import { gql } from "graphql-request";
import { Hex } from "viem";
import { z } from "zod";
import { zodHash, zodStringToBigInt } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

const DEPOSIT_EVENTS_QUERY = gql`
  query DepositEvents($deposit: String!) {
    poolEvents(where: { deposit: $deposit }, orderBy: timestamp, orderDirection: desc) {
      transactionHash
      deposited {
        amount
      }
      redeemed {
        shares
      }
      withdrawn {
        amount
      }
    }
  }
`;

const DEPOSIT_EVENTS_SCHEMA = z.array(
  z.object({
    transactionHash: zodHash,
    deposited: z
      .object({
        amount: zodStringToBigInt,
      })
      .nullable(),
    redeemed: z
      .object({
        shares: zodStringToBigInt,
      })
      .nullable(),
    withdrawn: z
      .object({
        amount: zodStringToBigInt,
      })
      .nullable(),
  }),
);

export type DepositEvent = z.infer<typeof DEPOSIT_EVENTS_SCHEMA>;

type GetDepositEventsParams = {
  chainId: number;
  deposit: Hex;
};

export async function getDepositEvents(params: GetDepositEventsParams) {
  const { chainId, ...variables } = params;
  const response = await getGQLClient(chainId).request<any>(DEPOSIT_EVENTS_QUERY, variables);
  return DEPOSIT_EVENTS_SCHEMA.parse(response.poolEvents);
}
