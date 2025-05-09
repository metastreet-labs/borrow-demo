import { Deposit } from "@/lib/subgraph/getDeposits";
import { max } from "lodash";
import type { RedemptionAvailable } from "./useRedemptionsAvailable";
import { useRedemptionsAvailable } from "./useRedemptionsAvailable";

export type RedemptionTotal = NonNullable<ReturnType<typeof calculateRedemptionsTotal>>;

function calculateRedemptionsTotal(redemptionAvailable: RedemptionAvailable[]) {
  const [sharesProcessed, amountAvailable] = redemptionAvailable.reduce(
    (total, data) => [total[0] + data.shares, total[1] + data.amount],
    [0n, 0n],
  );

  const sharesAhead = max(redemptionAvailable.map((d) => d.sharesAhead)) ?? 0n;

  return { sharesProcessed, amountAvailable, sharesAhead };
}

export function useRedemptionsTotal(deposits: Deposit[] | undefined) {
  const redemptionsAvailable = useRedemptionsAvailable(deposits);

  const totals: { [depositId: string]: RedemptionTotal | undefined } = {};

  deposits?.forEach((deposit) => {
    const available = redemptionsAvailable[deposit.id];
    if (available) totals[deposit.id] = calculateRedemptionsTotal(available);
  });

  return totals;
}
