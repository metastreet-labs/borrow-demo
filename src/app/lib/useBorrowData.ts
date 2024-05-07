"use client";

import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address, isAddress } from "viem";
import { wagmiConfig } from "../components/Providers";
import { POOL_ABI } from "../lib/abi";
import { getBorrowOptions } from "../lib/getBorrowOptions";
import { getOracleContext } from "../lib/getOracleContext";
import { getPool } from "../lib/getPool";

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

      const collateralValue = await readContract(wagmiConfig, {
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

      const borrowOptions = getBorrowOptions({ pool, collateralValue });

      return { borrowOptions, pool, oracleContext };
    },
    enabled: isAddress(params.poolAddress),
  });
}
