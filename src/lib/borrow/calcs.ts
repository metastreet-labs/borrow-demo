import { FixedPoint, toUnits } from "../shared/utils";
import { Loan } from "../subgraph/getLoans";

export function getLoanProration(loan: Loan, delta: number) {
  const currentTimestamp = new Date().getTime() / 1000 + delta;
  return Math.min((currentTimestamp - loan.timestamp) / loan.duration, 1.0);
}

export function getLoanProratedRepayment(loan: Loan) {
  /*
   * loan repayment is mainly used as an input to the erc20 `approve` function.
   * so use a 120s delta to avoid getting "insufficient allowance"
   * (calculate a repayment 120s in the future)
   */
  const proration = getLoanProration(loan, 120);
  return FixedPoint.mul(loan.repayment - loan.principal, toUnits(proration)) + loan.principal;
}

export function getMaxRepayment(principal: bigint, repayment: bigint) {
  return principal + (10_500n * (repayment - principal)) / 10_000n;
}
