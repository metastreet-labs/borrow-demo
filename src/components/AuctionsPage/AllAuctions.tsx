"use client";

import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { fromUnits, printNumber } from "@/lib/shared/utils";
import { Auction, getAuctions } from "@/lib/subgraph/auctions/getAuctions";
import { useQuery } from "@tanstack/react-query";
import { getUnixTime } from "date-fns";
import { clamp } from "lodash";
import { ReactNode } from "react";
import { isAddress, isAddressEqual } from "viem";
import { useAccount, useChainId } from "wagmi";
import { BidForm } from "./BidForm";
import { ClaimButton } from "./ClaimButton";

export function AllAuctions() {
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
    <div className="flex flex-col gap-4">
      <span className="text-lg font-bold">All Auctions</span>
      {child}
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
    if (highestBid && account && isAddressEqual(highestBid.bidder, account)) {
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
