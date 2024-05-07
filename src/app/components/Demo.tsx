"use client";

import { ReactNode, useState } from "react";
import { isAddress } from "viem";
import { fromUnits, getDaysFromSeconds, printNumber } from "../lib/numbers";
import { useBorrowData } from "../lib/useBorrowData";
import { BorrowButton } from "./BorrowButton";

export function Demo() {
  const [poolAddress, setPoolAddress] = useState("0x8c845a2c51e361d3835c7f2f214e03305582ed0a");
  const [tokenId, setTokenId] = useState("");

  const { data, error } = useBorrowData({ poolAddress, tokenId });

  const [selectedBorrowOptionIndex, setSelectedBorrowOptionIndex] = useState(0);

  const isPoolAddressValid = isAddress(poolAddress);
  const isTokenIdValid = /^\d+$/.test(tokenId);

  let borrowOptionsNode: ReactNode;
  let borrowButtonNode: ReactNode = null;

  if (!isPoolAddressValid) borrowOptionsNode = <span>Enter a valid pool address</span>;
  else if (!isTokenIdValid) borrowOptionsNode = <span>Enter a valid token id</span>;
  else if (!data) {
    if (error) borrowOptionsNode = <span>{error.message}</span>;
    else borrowOptionsNode = <span>Loading...</span>;
  } else {
    const {
      borrowOptions,
      pool: {
        currencyToken: { symbol },
      },
    } = data;

    borrowOptionsNode = borrowOptions.map((option, idx) => {
      const id = `borrow-option-${idx}`;
      const principal = `${printNumber(fromUnits(option.principal))} ${symbol}`;
      const duration = `${getDaysFromSeconds(option.duration)}d`;
      const repayment = `${printNumber(fromUnits(option.repayment))} ${symbol}`;

      return (
        <div key={idx} className="flex items-start gap-2 p-2 border">
          <input
            id={id}
            type="radio"
            checked={idx == selectedBorrowOptionIndex}
            onChange={() => setSelectedBorrowOptionIndex(idx)}
            className="mt-2"
          />
          <label htmlFor={id} className="flex flex-col text-sm">
            <span>Principal: {principal}</span>
            <span>Duration: {duration}</span>
            <span>Repayment: {repayment}</span>
          </label>
        </div>
      );
    });

    const selectedBorrowOption = data?.borrowOptions.at(selectedBorrowOptionIndex);
    if (selectedBorrowOption) {
      borrowButtonNode = (
        <BorrowButton
          pool={data.pool}
          tokenId={tokenId}
          borrowOption={data.borrowOptions[selectedBorrowOptionIndex]}
          oracleContext={data.oracleContext}
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <input
        value={poolAddress}
        onChange={(e) => setPoolAddress(e.target.value)}
        placeholder="Pool address"
      />

      <input
        type="number"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        placeholder="Token id"
      />

      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-4">{borrowOptionsNode}</div>
        {borrowButtonNode}
      </div>
    </div>
  );
}
