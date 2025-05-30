"use client";

import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { fromUnits, printNumber } from "@/lib/shared/utils";
import { Auction } from "@/lib/subgraph/auctions";
import { getUnixTime } from "date-fns";
import { clamp } from "lodash";
import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { AccountAuctions } from "./AccountAuctions";
import { AllAuctions } from "./AllAuctions";
import { BidForm } from "./BidForm";
import { ClaimButton } from "./ClaimButton";

export function AuctionsPage() {
  const sp = useSearchParamsMutation();
  const collection = sp.get("collection");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <span className="font-bold">Collection</span>
        <input
          value={collection ?? ""}
          onChange={(e) => sp.set("collection", e.target.value)}
          placeholder="Collection address"
          className="flex-grow"
        />
      </div>

      <div className="flex gap-8">
        <AllAuctions />
        <AccountAuctions />
      </div>
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const {
    id,
    collateralTokenId,
    highestBid,
    currencyToken: { symbol },
    endTime,
  } = auction;

  const { address: account } = useAccount();

  let remainingTime = clamp(endTime - getUnixTime(new Date()), 0, 86400);
  let fade = false;

  let action: ReactNode;
  if (remainingTime) {
    action = (
      <div className="flex flex-col gap-2">
        <span>Auction ends in {remainingTime} seconds</span>
        <BidForm auction={auction} />
      </div>
    );
  } else {
    if (highestBid?.bidder === account) {
      action = (
        <div className="flex gap-2">
          <span>You won the auction</span>
          <ClaimButton auction={auction} />
        </div>
      );
    } else {
      action = <span className="truncate">Auction winner: {highestBid?.bidder}</span>;
      fade = true;
    }
  }

  return (
    <div
      key={id}
      className={`flex flex-col border rounded-md p-4 w-96 ${fade ? "opacity-50" : ""}`}
    >
      <span className="truncate">Token ID: {collateralTokenId.toString()}</span>
      <span>
        Highest Bid: {printNumber(fromUnits(highestBid?.amount ?? 0n))} {symbol}
      </span>
      {action}
    </div>
  );
}
