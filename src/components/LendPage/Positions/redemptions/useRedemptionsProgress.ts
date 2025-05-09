import { POOL_ABI } from "@/lib/abis/Pool";
import { FixedPoint, fromUnits } from "@/lib/shared/utils";
import { Deposit } from "@/lib/subgraph/getDeposits";
import { useReadContracts } from "wagmi";
import { useRedemptionsTotal, type RedemptionTotal } from "./useRedemptionsTotal";

export type RedemptionProgress = NonNullable<ReturnType<typeof calculateRedemptionProgress>>;

function calculateRedemptionProgress(deposit: Deposit, total: RedemptionTotal, sharePrice: bigint) {
  if (!total) return;

  const totalSharesInQueue = deposit.redemptions.reduce(
    (total, redemption) => total + redemption.shares,
    0n,
  );
  const sharesRemaining = totalSharesInQueue - total.sharesProcessed;
  const amountRemaining = FixedPoint.mul(sharesRemaining, sharePrice);
  const progressPercent =
    totalSharesInQueue > 0
      ? fromUnits(FixedPoint.div(total.sharesProcessed, totalSharesInQueue)).toNumber()
      : 0;

  return {
    amountRemaining,
    amountAvailable: total.amountAvailable,
    sharesRemaining,
    sharesAhead: total.sharesAhead,
    progressPercent,
  };
}

export function useRedemptionsProgress(deposits: Deposit[] | undefined) {
  const totals = useRedemptionsTotal(deposits);

  const { data: sharePrices } = useReadContracts({
    contracts: deposits?.map(
      (d) =>
        ({
          address: d.pool.id,
          abi: POOL_ABI,
          functionName: "redemptionSharePrice",
          args: [d.tick.raw],
        }) as const,
    ),
    allowFailure: false,
  });
  const progress: { [depositId: string]: RedemptionProgress | undefined } = {};

  deposits?.forEach((deposit, idx) => {
    const total = totals[deposit.id];
    if (total)
      progress[deposit.id] = calculateRedemptionProgress(deposit, total, sharePrices?.[idx] ?? 0n);
  });

  return progress;
}
