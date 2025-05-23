"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { zodStringToBigInt } from "../../shared/utils";
import { getGQLClient } from "../graphqlClient";
import { AUCTION_SCHEMA } from "./schema";

type Params = {
  chainId: number;
  account: Address;
  collection: Address;
};

const ACCOUNT_AUCTIONS_QUERY = gql`
  query Auctions($account: String!, $collection: String!) {
    auctions(where: { bids_: { bidder: $account }, collateralToken: $collection }) {
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
      bids(where: { bidder: $account }, orderBy: timestamp, orderDirection: desc, first: 1) {
        amount
      }
    }
  }
`;

const ACCOUNT_AUCTION_SCHEMA = AUCTION_SCHEMA.extend({
  status: z.enum(["Created", "Started", "Ended"]),
  bids: z.array(z.object({ amount: zodStringToBigInt })),
});

export type AccountAuction = z.infer<typeof ACCOUNT_AUCTION_SCHEMA>;

export async function getAuctionsOfAccount(params: Params) {
  const { chainId, ...rest } = params;

  const client = getGQLClient(chainId);

  const response = await client.request<any>(ACCOUNT_AUCTIONS_QUERY, rest);

  return z.array(ACCOUNT_AUCTION_SCHEMA).parse(response.auctions);
}
