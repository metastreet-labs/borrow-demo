"use client";

import { getLoanProratedRepayment } from "@/lib/borrow/calcs";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useSearchParamsMutation } from "../../lib/shared/useSearchParamsMutation";
import { fromUnits, printNumber } from "../../lib/shared/utils";
import { Loan, getLoans } from "../../lib/subgraph/getLoans";
import { getPool } from "../../lib/subgraph/getPool";
import { useWeb3 } from "../shared/Providers";
import { Refinance } from "./refinance/Refinance";
import { RepayButton } from "./RepayButton";

export function Loans() {
  const { chainId, connectedWalletAddress } = useWeb3();
  const sp = useSearchParamsMutation();

  const poolAddress = sp.get("pool") ?? "";

  const { data, error } = useQuery({
    queryKey: ["loans", chainId, poolAddress, connectedWalletAddress] as const,
    queryFn: ({ queryKey }) => {
      const [, chainId, poolAddress, borrower] = queryKey;
      if (!borrower) throw new Error("borrower undefined");
      if (!isAddress(poolAddress)) throw new Error("poolAddress is not an address");

      return Promise.all([
        getPool({ chainId, poolAddress }),
        getLoans({ chainId, borrower, pool: poolAddress }),
      ]);
    },
    staleTime: Infinity,
    enabled: Boolean(connectedWalletAddress && isAddress(poolAddress)),
  });

  const [selectedLoan, setSelectedLoan] = useState<Loan>();

  useEffect(() => {
    setSelectedLoan(undefined);
  }, [chainId]);

  let rows: ReactNode;
  if (!connectedWalletAddress) {
    rows = <span>Connect wallet to see loans</span>;
  } else if (!data) {
    if (error) rows = <span>{error.message}</span>;
    else rows = <span>Loading...</span>;
  } else {
    if (!data[1].length) rows = <span>No Active loans for this wallet</span>;
    else {
      rows = data[1].map((loan) => (
        <LoanItem
          loan={loan}
          onClick={() => setSelectedLoan(loan)}
          selected={selectedLoan?.id == loan.id}
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

      {data && selectedLoan ? (
        <div className="flex flex-col items-start gap-8">
          <>
            <RepayButton pool={data[0]} loan={selectedLoan} />
            <Refinance pool={data[0]} loan={selectedLoan} />
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
