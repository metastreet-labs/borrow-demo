import { TickRouter } from "@metastreet/sdk-v2";
import { Pool } from "./subgraph/getPool";

type GetBorrowOptionsParams = {
  pool: Pool; // MetaStreet pool
  collateralValue: bigint; // value returned by `price()` function of the oracle contract
};

export type BorrowOption = ReturnType<typeof getBorrowOptions>[number];

export function getBorrowOptions(params: GetBorrowOptionsParams) {
  const { pool, collateralValue } = params;

  /* Construct a tick router */
  const router = new TickRouter(pool.durations, pool.rates);

  /* Transform subgraph ticks into SDK liquidity nodes */
  const liquidityNodes = pool.ticks.map((tick) => ({
    tick: tick.raw,
    available: tick.available,
    value: tick.value,
    shares: tick.shares,
    redemptions: tick.redemptionPending,
  }));

  /* get a borrow option for each pool duration */
  return pool.durations.map((duration) => {
    /* borrowing against 1 NFT */
    const multiplier = 1;

    /* get maximum principal for this duration */
    const maxPrincipal = router.forecast(liquidityNodes, duration, multiplier, collateralValue);

    /* get optimal nodes to source the above principal */
    const [bestNodes] = router.route(
      liquidityNodes,
      maxPrincipal,
      duration,
      multiplier,
      collateralValue,
    );

    /* quote a repayment for the above principal */
    const repayment = router.quote(
      liquidityNodes,
      bestNodes,
      maxPrincipal,
      duration,
      multiplier,
      collateralValue,
    );

    return { duration, principal: maxPrincipal, repayment, nodes: bestNodes };
  });
}
