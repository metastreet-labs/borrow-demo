import { find, findLast } from "lodash";
import { decodeTick, TickLimitType } from "./tickCodec";

const ABSOLUTE_SPACING_BPS = 1000n;

const RATIO_SPACING_BPS = 500n;

const BASIS_POINTS_SCALE = 10_000n;

function applySpacing(limit: bigint, limitType: TickLimitType) {
  if (limitType == TickLimitType.Ratio) return limit + RATIO_SPACING_BPS;

  return (limit * (BASIS_POINTS_SCALE + ABSOLUTE_SPACING_BPS)) / BASIS_POINTS_SCALE;
}

interface GetClosestValidLimitParams {
  limit: bigint;
  limitType: TickLimitType;
  ticks: bigint[];
}

export function getClosestValidLimit(params: GetClosestValidLimitParams) {
  const { limit, limitType, ticks: allTicks } = params;

  const space = (l: bigint) => applySpacing(l, limitType);

  const ticks = allTicks.map(decodeTick).filter((t) => t.limitType == limitType);

  const prevTick = findLast(ticks, (t) => t.limit <= limit);
  const nextTick = find(ticks, (t) => t.limit >= limit);

  if (nextTick && nextTick.limit < space(limit)) return nextTick.limit;

  if (prevTick && limit < space(prevTick.limit)) {
    const nextLimit = space(prevTick.limit);

    if (!nextTick || nextTick.limit == nextLimit) return nextLimit;

    if (nextTick.limit < space(nextLimit)) return nextTick.limit;

    return nextLimit;
  }

  return limit;
}
