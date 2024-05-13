"use client";

import { BorrowOption } from "@/app/lib/getBorrowOptions";
import { fromUnits, getDaysFromSeconds, printNumber } from "@/app/lib/utils";

type BorrowTermsProps = {
  option: BorrowOption;
  currencySymbol: string;
  selected: boolean;
  onSelected: () => void;
};

export function BorrowTerms(props: BorrowTermsProps) {
  const { option, currencySymbol, onSelected, selected } = props;

  const id = `borrow-option-${option.duration}`;
  const principal = `${printNumber(fromUnits(option.principal))} ${currencySymbol}`;
  const duration = `${getDaysFromSeconds(option.duration)}d`;
  const repayment = `${printNumber(fromUnits(option.repayment))} ${currencySymbol}`;

  return (
    <div
      className="flex items-start gap-2 p-2 border"
      onClick={onSelected}
      role="button"
      tabIndex={0}
    >
      <input id={id} type="radio" checked={selected} className="mt-2" />
      <div className="flex flex-col text-sm">
        <span>Principal: {principal}</span>
        <span>Duration: {duration}</span>
        <span>Repayment: {repayment}</span>
      </div>
    </div>
  );
}
