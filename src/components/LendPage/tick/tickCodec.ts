import { fromUnits, toUnits } from "@/lib/shared/utils";

export type DecodedTick = ReturnType<typeof decodeTick>;

const LIMIT_MASK = 2n ** 120n - 1n;
const LIMIT_SHIFT = 8n;

const DURATION_INDEX_MASK = 2n ** 3n - 1n;
const DURATION_INDEX_SHIFT = 5n;

const RATE_INDEX_MASK = 2n ** 3n - 1n;
const RATE_INDEX_SHIFT = 2n;

const LIMIT_TYPE_MASK = 2n ** 2n - 1n;

export enum TickLimitType {
  Absolute = 0,
  Ratio = 1,
}

export function decodeTick(tick: bigint) {
  return {
    limit: (tick >> LIMIT_SHIFT) & LIMIT_MASK,
    durationIndex: Number((tick >> DURATION_INDEX_SHIFT) & DURATION_INDEX_MASK),
    rateIndex: Number((tick >> RATE_INDEX_SHIFT) & RATE_INDEX_MASK),
    limitType: Number(tick & LIMIT_TYPE_MASK) as TickLimitType,
  };
}

export function encodeTick(tick: DecodedTick) {
  return (
    (tick.limit << LIMIT_SHIFT) +
    (BigInt(tick.durationIndex) << DURATION_INDEX_SHIFT) +
    (BigInt(tick.rateIndex) << RATE_INDEX_SHIFT) +
    BigInt(tick.limitType)
  );
}

const secondsInYear = 365n * 86400n;

export function normalizeTickRate(rate: string | number) {
  return toUnits(rate) / secondsInYear;
}

export function denormalizeTickRate(rate: bigint) {
  return fromUnits(rate * secondsInYear).toNumber();
}
