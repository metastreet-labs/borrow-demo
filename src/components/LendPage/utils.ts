import { fromUnits, printNumber } from "@/lib/shared/utils";
import { denormalizeTickRate, TickLimitType } from "./tick/tickCodec";

export function printRate(rate: bigint) {
  return `${Math.round(denormalizeTickRate(rate) * 100)}%`;
}

export function printDuration(duration: number) {
  return `${Math.round(duration / 86400)}d`;
}

export function printLimit(limit: bigint, limitType: TickLimitType, symbol: string) {
  if (limitType == TickLimitType.Absolute) return `${printNumber(fromUnits(limit))} ${symbol}`;
  else return `${Number(limit) / 100}% LTV`;
}
