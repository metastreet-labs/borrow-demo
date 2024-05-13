import { ReactNode, useState } from "react";
import { Loan } from "../../lib/subgraph/getLoans";
import { Pool } from "../../lib/subgraph/getPool";
import { useBorrowData } from "../../lib/useBorrowData";
import { BorrowTerms } from "../borrow/BorrowTerms";
import { RefinanceButton } from "./RefinanceButton";

type RefinanceProps = {
  loan: Loan;
  pool: Pool;
};

export function Refinance(props: RefinanceProps) {
  const { loan, pool } = props;

  const { data, error } = useBorrowData({ pool, tokenId: `${loan.collateralTokenIds[0]}`, loan });

  const [selectedBorrowOptionIndex, setSelectedBorrowOptionIndex] = useState(0);

  const selectedBorrowOption = data?.borrowOptions.at(selectedBorrowOptionIndex);

  let borrowOptionNodes: ReactNode;
  if (!data) {
    if (error) borrowOptionNodes = <span>{error.message}</span>;
    else borrowOptionNodes = "Loading...";
  } else {
    borrowOptionNodes = data.borrowOptions.map((option, idx) => {
      return (
        <BorrowTerms
          key={idx}
          option={option}
          currencySymbol={pool.currencyToken.symbol}
          selected={idx == selectedBorrowOptionIndex}
          onSelected={() => setSelectedBorrowOptionIndex(idx)}
        />
      );
    });
  }

  let refinanceButton: ReactNode = null;
  if (data && selectedBorrowOption) {
    refinanceButton = (
      <RefinanceButton
        pool={pool}
        loan={loan}
        borrowOption={selectedBorrowOption}
        oracleContext={data.oracleContext}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h2>Refinance</h2>
      <div className="flex items-start gap-8">
        <div className="flex flex-col gap-2">{borrowOptionNodes}</div>
        {refinanceButton}
      </div>
    </div>
  );
}
