"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { zodAddress, zodHex, zodStringToBigInt, zodStringToNumber } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

const AUCTIONS_QUERY = gql`
  query Auctions($collection: String!) {
    auctions(where: { collateralToken: $collection, status_not: Ended }) {
      id
      liquidation {
        id
        loan {
          loanReceipt
        }
      }
      collateralToken {
        id
      }
      currencyToken {
        id
        symbol
        decimals
      }
      collateralTokenId
      highestBid {
        amount
        bidder
      }
      endTime
    }
  }
`;

const AUCTIONS_SCHEMA = z.array(
  z.object({
    id: zodHex,
    liquidation: z.object({
      id: zodHex,
      loan: z.object({
        loanReceipt: zodHex,
      }),
    }),
    collateralToken: z.object({
      id: zodAddress,
    }),
    currencyToken: z.object({
      id: zodAddress,
      symbol: z.string(),
      decimals: z.number(),
    }),
    collateralTokenId: zodStringToBigInt,
    highestBid: z
      .object({
        amount: zodStringToBigInt,
        bidder: zodAddress,
      })
      .nullable(),
    endTime: zodStringToNumber,
  }),
);

export type Auction = z.infer<typeof AUCTIONS_SCHEMA>[number];

type GetAuctionsParams = {
  chainId: number;
  collection: Address;
};

export async function getAuctions(params: GetAuctionsParams) {
  const { chainId, ...variables } = params;
  const response = await getGQLClient(chainId).request<any>(AUCTIONS_QUERY, variables);
  return AUCTIONS_SCHEMA.parse(response.auctions);
}
