"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WATCHES_POOL_ADDRESS } from "../lib/constants";
import { Loan, getLoans } from "../lib/subgraph/getLoans";
import { Pool, getPool } from "../lib/subgraph/getPool";
import { FixedPoint, fromUnits, printNumber, toUnits } from "../lib/utils";
import { useWeb3 } from "./Providers";
import { RepayButton } from "./RepayButton";
import { Refinance } from "./refinance/Refinance";

export function Loans() {
  const { chainId, connectedWalletAddress } = useWeb3();

  const { data, error } = useQuery({
    queryKey: ["loans", chainId, connectedWalletAddress] as const,
    queryFn: ({ queryKey }) => {
      const [, chainId, borrower] = queryKey;
      if (!borrower) throw new Error("borrower undefined");
      const poolAddress = WATCHES_POOL_ADDRESS[chainId];
      return Promise.all([
        getPool({ chainId, poolAddress }),
        getLoans({ chainId, borrower, pool: poolAddress }),
      ]);
    },
    staleTime: Infinity,
    enabled: Boolean(connectedWalletAddress),
  });

  type LoanItem = { pool: Pool; loan: Loan };
  const [selectedItem, setSelectedItem] = useState<LoanItem>();

  let rows: ReactNode;
  if (!connectedWalletAddress) {
    rows = <span>Connect wallet to see loans</span>;
  } else if (!data) {
    if (error) rows = <span>{error.message}</span>;
    else rows = <span>Loading...</span>;
  } else {
    if (!data[1].length) rows = <span>No Active loans for this wallet</span>;
    else {
      const pool = data[0];
      rows = data[1].map((loan) => (
        <LoanItem
          loan={loan}
          onClick={() => setSelectedItem({ loan, pool })}
          selected={selectedItem?.loan.id == loan.id}
          key={loan.id}
        />
      ));
    }
  }

  return (
    <div className="flex flex-col">
      <h2>Loans List</h2>
      <div className="flex flex-wrap gap-2">{rows}</div>

      <h2 className="my-8">Manage Loan</h2>

      {selectedItem ? (
        <div className="flex flex-col items-start gap-8">
          <>
            <RepayButton {...selectedItem} />
            <Refinance {...selectedItem} />
          </>
        </div>
      ) : (
        <span>Select a loan</span>
      )}
    </div>
  );
}

type LoanItemProps = {
  loan: Loan;
  onClick: () => void;
  selected: boolean;
};

function LoanItem(props: LoanItemProps) {
  const { loan, onClick, selected } = props;

  return (
    <div
      className={`flex flex-col border p-2 ${selected ? "border-purple-400 border-2" : ""}`}
      key={loan.id}
      role="button"
      tabIndex={0}
      onClick={() => onClick()}
    >
      <span>Collateral: {loan.collateralTokenIds.join()}</span>
      <span>Maturity: {new Date(loan.maturity * 1000).toLocaleString()}</span>
      <span>Repayment at maturity: {printNumber(fromUnits(loan.repayment))}</span>
      <span>Repayment now: {printNumber(fromUnits(getLoanProratedRepayment(loan)))}</span>
      <button className="button">Manage</button>
    </div>
  );
}

/* Loan stuff */

export function getLoanProration(loan: Loan) {
  /*
   * might wanna add more than 60 seconds if you start seeing
   * "insufficient allowance" errors (or use infinite approval)
   */
  const currentTimestamp = new Date().getTime() / 1000 + 60;
  return Math.min((currentTimestamp - loan.timestamp) / loan.duration, 1.0);
}

export function getLoanProratedRepayment(loan: Loan) {
  const proration = getLoanProration(loan);
  return FixedPoint.mul(loan.repayment - loan.principal, toUnits(proration)) + loan.principal;
}

export function getMaxRepayment(principal: bigint, repayment: bigint) {
  return principal + (10_500n * (repayment - principal)) / 10_000n;
}
