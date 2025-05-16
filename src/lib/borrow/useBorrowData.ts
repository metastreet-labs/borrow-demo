"use client";

import { useWeb3, wagmiConfig } from "@/components/shared/Providers";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import * as devalue from "devalue";
import { Address, isAddress, zeroAddress } from "viem";
import { useBlockNumber } from "wagmi";
import { SSPO_ABI } from "../abis/SimpleSignedPriceOracle";
import { FixedPoint } from "../shared/utils";
import { Loan } from "../subgraph/getLoans";
import { Pool, getPool } from "../subgraph/getPool";
import { getBorrowOptions } from "./getBorrowOptions";
import { getOracleContext } from "./oracle-context";

type UseBorrowOptionsParams = {
  pool: string | Pool;
  tokenId: string;
  quantity: number;
  loan?: Loan;
};

export function useBorrowData(params: UseBorrowOptionsParams) {
  const { chainId } = useWeb3();

  const { data: blockNumber } = useBlockNumber({ watch: true });

  return useQuery({
    queryKey: ["borrow-options", chainId, devalue.stringify({ ...params, blockNumber })] as const,
    queryFn: async ({ queryKey }) => {
      const [, chainId, stringifiedParams] = queryKey;

      const {
        pool: poolAddressOrObject,
        tokenId,
        loan,
        quantity,
      } = devalue.parse(stringifiedParams) as UseBorrowOptionsParams;

      const pool =
        typeof poolAddressOrObject == "string"
          ? await getPool({ chainId, poolAddress: poolAddressOrObject as Address })
          : poolAddressOrObject;

      if (!pool.isERC1155Pool && quantity != 1) {
        throw new Error("Quantity must be 1 for non-ERC1155 pools");
      }

      const oracleContext = await getOracleContext({
        chainId,
        pool: pool.id,
        collateralToken: pool.collateralToken.id,
        collateralTokenId: tokenId,
      });

      const price =
        pool.externalPriceOracle == zeroAddress
          ? 0n
          : await readContract(wagmiConfig, {
              address: pool.id,
              abi: SSPO_ABI,
              functionName: "price",
              args: [
                pool.collateralToken.id,
                pool.currencyToken.id,
                [BigInt(tokenId)],
                [BigInt(quantity)],
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
        multiplier: quantity,
      }).filter((o) => o.principal != o.repayment);

      return { borrowOptions, pool, oracleContext };
    },
    enabled: typeof params.pool != "string" || isAddress(params.pool),
    retry: false,
    placeholderData: (prev) => prev,
  });
}
