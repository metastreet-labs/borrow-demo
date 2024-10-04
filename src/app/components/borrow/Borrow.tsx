"use client";

import { useBorrowData } from "@/app/lib/useBorrowData";
import { useSearchParamsMutation } from "@/app/lib/useSearchParamsMutation";
import { ReactNode, useState } from "react";
import { isAddress } from "viem";
import { BorrowButton } from "./BorrowButton";
import { BorrowTerms } from "./BorrowTerms";

export function Borrow() {
  const sp = useSearchParamsMutation();

  const poolAddress = sp.get("pool") ?? "";
  const tokenId = sp.get("tokenId") ?? "";

  const { data, error } = useBorrowData({ pool: poolAddress, tokenId });
  console.log({ data, error });

  const [selectedBorrowOptionIndex, setSelectedBorrowOptionIndex] = useState(0);

  const isPoolAddressValid = isAddress(poolAddress);
  const isTokenIdValid = /^\d+$/.test(tokenId);

  let borrowOptionsNode: ReactNode;
  let borrowButtonNode: ReactNode = null;

  if (!isPoolAddressValid) borrowOptionsNode = <span>Enter a valid pool address</span>;
  else if (!isTokenIdValid) borrowOptionsNode = <span>Enter a valid token id</span>;
  else if (!data) {
    if (error) borrowOptionsNode = <span className="text-red-500">{error.message}</span>;
    else borrowOptionsNode = <span>Loading...</span>;
  } else {
    const {
      borrowOptions,
      pool: {
        currencyToken: { symbol },
      },
    } = data;

    borrowOptionsNode = borrowOptions.map((option, idx) => {
      return (
        <BorrowTerms
          key={idx}
          option={option}
          currencySymbol={symbol}
          selected={idx == selectedBorrowOptionIndex}
          onSelected={() => setSelectedBorrowOptionIndex(idx)}
        />
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
      <h2>Borrow</h2>

      <input
        value={poolAddress}
        onChange={(e) => sp.set("pool", e.target.value)}
        placeholder="Pool address"
      />

      <input
        type="number"
        value={tokenId}
        onChange={(e) => sp.set("tokenId", e.target.value)}
        placeholder="Token id"
      />

      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-4">{borrowOptionsNode}</div>
        {borrowButtonNode}
      </div>
    </div>
  );
}
