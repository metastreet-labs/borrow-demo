"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { extractBatchQuantities } from "../shared/extractBatchQuantities";
import { zodHex, zodStringToBigInt } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

const WRAPPED_TOKENS_QUERY = gql`
  query WrappedTokens($account: Bytes!, $collection: Bytes!) {
    batches(where: { owner: $account, underlyingCollateralTokenAddress: $collection }) {
      id
      collateralWrapperContext
      underlyingCollateralTokenIds
    }
  }
`;

const WRAPPED_TOKENS_SCHEMA = z.object({
  batches: z.array(
    z.object({
      id: zodStringToBigInt,
      collateralWrapperContext: zodHex,
      underlyingCollateralTokenIds: z.array(zodStringToBigInt),
    }),
  ),
});

export type WrappedToken = Awaited<ReturnType<typeof getWrappedTokens>>[number];

type GetWrappedTokensParams = {
  chainId: number;
  account: Address;
  collection: Address;
};

export async function getWrappedTokens(params: GetWrappedTokensParams) {
  const { chainId, account, collection } = params;
  const response = await getGQLClient(chainId).request<any>(WRAPPED_TOKENS_QUERY, {
    account,
    collection,
  });
  const wrappedTokens = WRAPPED_TOKENS_SCHEMA.parse(response);

  return wrappedTokens.batches.map((t) => ({
    ...t,
    quantities: extractBatchQuantities(t.collateralWrapperContext),
  }));
}
