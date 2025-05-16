import { LiquidityNode, TickRouter } from "@metastreet/sdk-v2";
import { Loan } from "../subgraph/getLoans";
import { Pool } from "../subgraph/getPool";
import { getLoanProration } from "./calcs";

type GetBorrowOptionsParams = {
  pool: Pool; // MetaStreet pool
  collateralValue: bigint; // value returned by `price()` function of the oracle contract
  multiplier: number;
  loan?: Loan; // in case of refinance
};

export type BorrowOption = ReturnType<typeof getBorrowOptions>[number];

export function getBorrowOptions(params: GetBorrowOptionsParams) {
  const { pool, loan, collateralValue, multiplier } = params;

  /* Construct a tick router */
  const router = new TickRouter(pool.durations, pool.rates);

  /* Transform subgraph ticks into SDK liquidity nodes */
  const liquidityNodes = getLiquidityNodes(pool, loan);

  /* get a borrow option for each pool duration */
  return pool.durations.map((duration) => {
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

function getLiquidityNodes(pool: Pool, loan?: Loan) {
  /* Construct a tick router */
  const router = new TickRouter(pool.durations, pool.rates);

  /* Transform subgraph ticks into SDK liquidity nodes */
  let nodes: LiquidityNode[] = pool.ticks.map((tick) => ({
    tick: tick.raw,
    available: tick.available,
    value: tick.value,
    shares: tick.shares,
    redemptions: tick.redemptionPending,
  }));

  /* factor in loan repayment in case of refinance */
  if (loan) {
    const receipts = loan.ticks.map((tick, idx) => ({
      tick,
      used: loan.useds[idx],
      pending: loan.useds[idx] + loan.interests[idx],
    }));
    /*
     * refinancing uses liquidity from the loan repayment to make a new loan.
     * the higher the proration the higher the repayment amount,
     * so we use a -60s delta to avoid getting "InsufficientLiquidity" errors.
     */
    nodes = router.apply(nodes, receipts, getLoanProration(loan, -60));
  }

  return nodes;
}
