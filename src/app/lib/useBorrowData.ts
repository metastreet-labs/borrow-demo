"use client";

import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import * as devalue from "devalue";
import { Address, isAddress } from "viem";
import { useWeb3, wagmiConfig } from "../components/Providers";
import { getBorrowOptions } from "../lib/getBorrowOptions";
import { getOracleContext } from "../lib/getOracleContext";
import { SSPO_ABI } from "./abis/SimpleSignedPriceOracle";
import { Loan } from "./subgraph/getLoans";
import { Pool, getPool } from "./subgraph/getPool";
import { FixedPoint } from "./utils";

type UseBorrowOptionsParams = {
  pool: string | Pool;
  tokenId: string;
  loan?: Loan;
};

export function useBorrowData(params: UseBorrowOptionsParams) {
  const { chainId } = useWeb3();

  return useQuery({
    queryKey: ["borrow-options", chainId, devalue.stringify(params)] as const,
    queryFn: async ({ queryKey }) => {
      const [, chainId, stringifiedParams] = queryKey;

      const {
        pool: poolAddressOrObject,
        tokenId,
        loan,
      } = devalue.parse(stringifiedParams) as UseBorrowOptionsParams;

      const pool =
        typeof poolAddressOrObject == "string"
          ? await getPool({ chainId, poolAddress: poolAddressOrObject as Address })
          : poolAddressOrObject;

      const oracleContext = await getOracleContext(chainId, tokenId);

      const price = await readContract(wagmiConfig, {
        address: pool.id,
        abi: SSPO_ABI,
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
        loan,
        /* currently SDK only works with 18 decimals, so must scale up */
        collateralValue: FixedPoint.scaleUp(
          price,
          FixedPoint.DECIMALS - pool.currencyToken.decimals,
        ),
      });

      return { borrowOptions, pool, oracleContext };
    },
    enabled: typeof params.pool != "string" || isAddress(params.pool),
    retry: false,
  });
}
