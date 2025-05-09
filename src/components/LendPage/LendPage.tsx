"use client";

import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { getPool } from "@/lib/subgraph/getPool";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { isAddress } from "viem";
import { useChainId } from "wagmi";
import { Deposit } from "./Deposit/Deposit";
import { PoolProvider } from "./PoolProvider";
import { Positions } from "./Positions/Positions";

export function LendPage() {
  const chainId = useChainId();
  const sp = useSearchParamsMutation();

  const poolAddress = sp.get("pool");

  const { data, error } = useQuery({
    queryKey: ["lend-pool", chainId, poolAddress] as const,
    queryFn: ({ queryKey }) => {
      const [, chainId, poolAddress] = queryKey;

      if (!poolAddress || !isAddress(poolAddress)) throw new Error("Invalid pool address");

      return getPool({ chainId, poolAddress });
    },
    enabled: Boolean(poolAddress && isAddress(poolAddress)),
  });

  let child: ReactNode;

  if (!data) {
    if (error) child = <span className="text-red-500">{error.message}</span>;
    else child = <span>Loading...</span>;
  } else {
    child = (
      <PoolProvider pool={data}>
        <Deposit />
        <Positions />
      </PoolProvider>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4 ">
        <span>Pool address</span>
        <input
          value={poolAddress ?? ""}
          onChange={(e) => sp.set("pool", e.target.value)}
          placeholder="Pool address"
          className="flex-grow"
        />
      </div>
      {child}
    </div>
  );
}
