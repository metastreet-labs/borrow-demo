"use client";

import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { fromUnits, printNumber } from "@/lib/shared/utils";
import { Auction, getAuctions } from "@/lib/subgraph/getAuctions";
import { useQuery } from "@tanstack/react-query";
import { getUnixTime } from "date-fns";
import { clamp } from "lodash";
import { ReactNode } from "react";
import { isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { BidForm } from "./BidForm";
import { ClaimButton } from "./ClaimButton";

export function AuctionsPage() {
  const chainId = useChainId();

  const sp = useSearchParamsMutation();
  const collection = sp.get("collection");

  const { data: auctions, error: auctionsError } = useQuery({
    queryKey: ["auctions", chainId, collection] as const,
    queryFn: ({ queryKey }) => {
      const [, chainId, collection] = queryKey;
      if (!collection || !isAddress(collection)) throw new Error("Invalid collection address");
      return getAuctions({ chainId, collection });
    },
    enabled: !!collection && isAddress(collection),
  });

  let child: ReactNode;
  if (!auctions) {
    if (auctionsError) child = <span className="text-red-500">{auctionsError.message}</span>;
    else child = <span className="text-gray-500">Loading...</span>;
  } else {
    if (!auctions.length) child = <span className="text-gray-500">No auctions found</span>;
    else
      child = (
        <div className="flex flex-col gap-4">
          {auctions.map((auction) => {
            return <AuctionCard key={auction.id} auction={auction} />;
          })}
        </div>
      );
  }

  return (
    <div className="flex flex-col">
      <input
        value={collection ?? ""}
        onChange={(e) => sp.set("collection", e.target.value)}
        placeholder="Collection address"
      />
      <div className="flex my-8">{child}</div>
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
      /* Auction is over, but the user didn't win, so don't show the card */
      return null;
    }
  }

  return (
    <div key={id} className="flex flex-col border rounded-md p-4 w-96">
      <span className="truncate">Token ID: {collateralTokenId.toString()}</span>
      <span>
        Highest Bid: {printNumber(fromUnits(highestBid?.amount ?? 0n))} {symbol}
      </span>
      {action}
    </div>
  );
}
