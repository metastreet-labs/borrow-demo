"use client";

import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address, isAddress } from "viem";
import { wagmiConfig } from "../components/Providers";
import { POOL_ABI } from "../lib/abi";
import { getBorrowOptions } from "../lib/getBorrowOptions";
import { getOracleContext } from "../lib/getOracleContext";
import { getPool } from "../lib/getPool";
import { FixedPoint } from "./utils";

type UseBorrowOptionsParams = {
  poolAddress: string;
  tokenId: string;
};

export function useBorrowData(params: UseBorrowOptionsParams) {
  return useQuery({
    queryKey: ["borrow-options", params] as const,
    queryFn: async ({ queryKey }) => {
      const [, { poolAddress, tokenId }] = queryKey;

      const pool = await getPool(poolAddress as Address);

      const oracleContext = await getOracleContext(tokenId);

      const price = await readContract(wagmiConfig, {
        address: pool.id,
        abi: POOL_ABI,
        functionName: "price",
        args: [
          pool.collateralToken.id,
          pool.currencyToken.id,
          [BigInt(tokenId)],
          [1n], // token id quantities, always 1 for erc721
          oracleContext,
        ],
      });

      const borrowOptions = getBorrowOptions({
        pool,
        /* currently SDK only works with 18 decimals, so must scale up */
        collateralValue: FixedPoint.scaleUp(
          price,
          FixedPoint.DECIMALS - pool.currencyToken.decimals,
        ),
      });

      return { borrowOptions, pool, oracleContext };
    },
    enabled: isAddress(params.poolAddress),
    retry: false,
  });
}
