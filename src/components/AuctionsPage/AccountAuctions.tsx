import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { fromUnits, printNumber } from "@/lib/shared/utils";
import { AccountAuction, getAuctionsOfAccount } from "@/lib/subgraph/auctions";
import { useQuery } from "@tanstack/react-query";
import { getUnixTime } from "date-fns";
import { clamp } from "lodash";
import { ReactNode } from "react";
import { isAddress, isAddressEqual } from "viem";
import { useAccount } from "wagmi";
import { useWeb3 } from "../shared/Providers";
import { BidForm } from "./BidForm";
import { ClaimButton } from "./ClaimButton";

export function AccountAuctions() {
  const { connectedWalletAddress, chainId } = useWeb3();

  const sp = useSearchParamsMutation();
  const collection = sp.get("collection");

  const { data, error } = useQuery({
    queryKey: ["account-auctions", chainId, collection, connectedWalletAddress] as const,
    queryFn: async ({ queryKey }) => {
      const [, chainId, collection, account] = queryKey;

      if (!collection || !isAddress(collection) || !account) {
        throw new Error("Invalid params");
      }

      return getAuctionsOfAccount({ chainId, account, collection });
    },
    enabled: Boolean(collection && isAddress(collection) && connectedWalletAddress),
  });

  let children: ReactNode;

  if (!data) {
    if (error) {
      children = <div className="text-red-500">{error.message}</div>;
    } else {
      children = <div className="text-gray-500">Loading...</div>;
    }
  } else {
    if (!data.length) {
      children = <div className="text-gray-500">You have no auctions</div>;
    } else {
      children = (
        <div className="flex flex-col">
          {data.map((auction) => (
            <AccountAuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <span className="text-lg font-bold">My Auctions</span>
        {children}
      </div>
    );
  }

  function AccountAuctionCard({ auction }: { auction: AccountAuction }) {
    const {
      id,
      collateralTokenId,
      highestBid,
      currencyToken: { symbol },
      endTime,
      bids,
    } = auction;

    const { address: account } = useAccount();

    let remainingTime = clamp(endTime - getUnixTime(new Date()), 0, 86400);
    let fade = false;

    let status: "winning" | "losing" | "won" | "lost" | undefined;
    let statusCn = "";

    let action: ReactNode;

    /* should never happen */
    if (!highestBid || !account) return null;

    if (remainingTime) {
      [status, statusCn] = isAddressEqual(highestBid.bidder, account)
        ? ["winning", "bg-green-300"]
        : ["losing", "bg-orange-300"];

      action = (
        <div className="flex flex-col gap-2">
          <span>Auction ends in {remainingTime} seconds</span>
          <BidForm auction={auction} />
        </div>
      );
    } else {
      if (isAddressEqual(highestBid.bidder, account)) {
        status = "won";
        statusCn = "bg-green-500";
        action = (
          <div className="flex gap-2">
            <span>You won the auction</span>
            <ClaimButton auction={auction} />
          </div>
        );
      } else {
        status = "lost";
        statusCn = "bg-red-500";
        action = <span className="truncate">Auction winner: {highestBid?.bidder}</span>;
        fade = true;
      }
    }

    return (
      <div
        key={id}
        className={`flex flex-col border rounded-md p-4 w-96 ${fade ? "opacity-50" : ""}`}
      >
        <span className={`text-sm px-4 py-1 self-center rounded ${statusCn}`}>{status}</span>

        <span className="truncate">Token ID: {collateralTokenId.toString()}</span>

        <span>
          Highest Bid: {printNumber(fromUnits(highestBid?.amount ?? 0n))} {symbol}
        </span>

        <span>
          My bid: {printNumber(fromUnits(bids[0].amount))} {symbol}
        </span>
        {action}
      </div>
    );
  }
}
