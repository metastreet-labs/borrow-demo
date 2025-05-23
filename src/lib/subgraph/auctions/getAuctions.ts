"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { getGQLClient } from "../graphqlClient";
import { AUCTION_SCHEMA } from "./schema";

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
      status
    }
  }
`;

export type Auction = z.infer<typeof AUCTION_SCHEMA>;

type GetAuctionsParams = {
  chainId: number;
  collection: Address;
};

export async function getAuctions(params: GetAuctionsParams) {
  const { chainId, ...variables } = params;
  const response = await getGQLClient(chainId).request<any>(AUCTIONS_QUERY, variables);
  return z.array(AUCTION_SCHEMA).parse(response.auctions);
}
