"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { extractBatchQuantities } from "../shared/extractBatchQuantities";
import { zodHex, zodStringToBigInt, zodStringToNumber } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

const LOANS_QUERY = gql`
  query Loans($pool: String!, $borrower: String!) {
    loans(where: { borrower: $borrower, pool: $pool, status: Active }, first: 1000) {
      id
      collateralTokenIds
      loanReceipt
      principal
      repayment
      maturity
      duration
      timestamp
      ticks
      useds
      interests
      batch {
        id
        collateralWrapperContext
        underlyingCollateralTokenIds
      }
    }
  }
`;

const LOANS_SCHEMA = z.array(
  z.object({
    id: z.string(),
    collateralTokenIds: z.array(zodStringToBigInt),
    loanReceipt: zodHex,
    principal: zodStringToBigInt,
    repayment: zodStringToBigInt,
    maturity: zodStringToNumber,
    duration: zodStringToNumber,
    timestamp: zodStringToNumber,
    ticks: z.array(zodStringToBigInt),
    useds: z.array(zodStringToBigInt),
    interests: z.array(zodStringToBigInt),
    batch: z
      .object({
        id: zodStringToBigInt,
        collateralWrapperContext: zodHex,
        underlyingCollateralTokenIds: z.array(zodStringToBigInt),
      })
      .nullable(),
  }),
);

export type Loan = Awaited<ReturnType<typeof getLoans>>[number];

type GetLoansParams = {
  chainId: number;
  pool: Address;
  borrower: Address;
};

export async function getLoans(params: GetLoansParams) {
  const { chainId, ...variables } = params;

  const response = await getGQLClient(chainId).request<any>(LOANS_QUERY, variables);
  const loans = LOANS_SCHEMA.parse(response.loans);

  return loans.map((l) => ({
    ...l,
    batch: l.batch
      ? { ...l.batch, quantities: extractBatchQuantities(l.batch.collateralWrapperContext) }
      : null,
  }));
}
