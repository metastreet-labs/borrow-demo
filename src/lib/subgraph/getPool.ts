"use server";

import { gql } from "graphql-request";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { z } from "zod";
import { COLLATERAL_WRAPPERS } from "../borrow/collateral-wrappers";
import { zodAddress, zodStringToBigInt } from "../shared/utils";
import { getGQLClient } from "./graphqlClient";

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
      collateralWrappers
      ticks(where: { active: true }) {
        raw
        available
        value
        shares
        redemptionPending
      }
      externalPriceOracle
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
  collateralWrappers: z.array(zodAddress),
  ticks: z.array(
    z.object({
      raw: zodStringToBigInt,
      available: zodStringToBigInt,
      value: zodStringToBigInt,
      shares: zodStringToBigInt,
      redemptionPending: zodStringToBigInt,
    }),
  ),
  externalPriceOracle: zodAddress.nullable().transform((a) => a ?? zeroAddress),
});

export type Pool = Awaited<ReturnType<typeof getPool>>;

type GetPoolParams = {
  chainId: number;
  poolAddress: Address;
};

export async function getPool(params: GetPoolParams) {
  const { chainId, poolAddress } = params;
  const response = await getGQLClient(chainId).request<any>(POOL_QUERY, { id: poolAddress });
  const pool = POOL_SCHEMA.parse(response.pool);

  return {
    ...pool,
    isERC1155Pool: pool.collateralWrappers.some((cw) =>
      isAddressEqual(cw, COLLATERAL_WRAPPERS[chainId].erc1155),
    ),
  };
}
