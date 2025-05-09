import { POOL_ABI } from "@/lib/abis/Pool";
import { Deposit } from "@/lib/subgraph/getDeposits";
import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";

export interface RedemptionAvailable {
  shares: bigint;
  amount: bigint;
  sharesAhead: bigint;
}

export function useRedemptionsAvailable(deposits: Deposit[] | undefined) {
  const { address: account } = useAccount();

  let contracts = undefined;
  if (account && deposits) {
    contracts = deposits
      .map((d) => {
        return d.redemptions.map((r) => {
          return {
            address: d.pool.id,
            abi: POOL_ABI,
            functionName: "redemptionAvailable",
            args: [account, d.tick.raw, r.redemptionId],
          } as const;
        });
      })
      .flat();
  }

  const { data } = useReadContracts({ contracts, allowFailure: false });

  return useMemo(() => {
    const map: { [depositId: string]: RedemptionAvailable[] | undefined } = {};

    const data_ = data ?? deposits?.map((d) => d.redemptions.map((_) => [0n, 0n, 0n])).flat();

    if (deposits && data_) {
      let i = 0;
      deposits.forEach((d) => {
        map[d.id] = d.redemptions.map((_, j) => ({
          shares: data_[i + j][0],
          amount: data_[i + j][1],
          sharesAhead: data_[i + j][2],
        }));
        i += d.redemptions.length;
      });
    }

    return map;
  }, [deposits, data]);
}
