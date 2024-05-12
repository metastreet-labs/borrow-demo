"use server";

import { gql } from "graphql-request";
import { Address } from "viem";
import { z } from "zod";
import { zodHex, zodStringToBigInt, zodStringToNumber } from "../utils";
import { GRAPHQL_CLIENT } from "./graphqlClient";

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
  }),
);

export type Loan = z.infer<typeof LOANS_SCHEMA>[number];

type GetLoansParams = {
  pool: Address;
  borrower: Address;
};

export async function getLoans(params: GetLoansParams) {
  const response = await GRAPHQL_CLIENT.request<any>(LOANS_QUERY, params);
  return LOANS_SCHEMA.parse(response.loans);
}
