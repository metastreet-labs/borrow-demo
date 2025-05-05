import { EACL_ABI } from "@/lib/abis/EACL";
import { FixedPoint, fromInput, fromUnits, printNumber, toUnits } from "@/lib/shared/utils";
import { Auction } from "@/lib/subgraph/getAuctions";
import { useState } from "react";
import { erc20Abi } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { wagmiConfig } from "../shared/Providers";
import { EACL_ADDRESS } from "./constants";

type Props = {
  auction: Auction;
};

export function BidForm(props: Props) {
  const {
    auction: {
      highestBid,
      currencyToken: { id: currencyTokenAddress, decimals, symbol },
      liquidation,
      collateralToken,
      collateralTokenId,
    },
  } = props;

  const chainId = useChainId();
  const { address: account } = useAccount();

  const eaclAddress = EACL_ADDRESS[chainId];

  const { data: balance = 0n } = useReadContract({
    address: currencyTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account && [account],
  });

  const { data: minimumBidBasisPoints = 0n } = useReadContract({
    address: eaclAddress,
    abi: EACL_ABI,
    functionName: "minimumBidBasisPoints",
  });

  const highestBidAmount = FixedPoint.scaleDown(
    highestBid?.amount ?? 0n,
    FixedPoint.DECIMALS - decimals,
  );
  const minimumBid = highestBidAmount + (highestBidAmount * minimumBidBasisPoints) / 10_000n;

  const existingUserBid = highestBid && highestBid.bidder === account ? highestBid.amount : 0n;
  const neededBalance = minimumBid - existingUserBid;

  const [bidAmount, setBidAmount] = useState("");
  const bidAmountUnits = toUnits(fromInput(bidAmount), decimals);

  const isBidInsufficient = !bidAmountUnits || bidAmountUnits < minimumBid;
  const isBalanceInsufficient = neededBalance > balance;

  async function _bid() {
    if (!account) return;

    const allowance = await readContract(wagmiConfig, {
      address: currencyTokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account, eaclAddress],
    });

    if (allowance < bidAmountUnits) {
      const hash = await writeContract(wagmiConfig, {
        address: currencyTokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [eaclAddress, bidAmountUnits],
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const hash = await writeContract(wagmiConfig, {
      address: eaclAddress,
      abi: EACL_ABI,
      functionName: "bid",
      args: [liquidation.id, collateralToken.id, collateralTokenId, bidAmountUnits],
    });

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);

  async function bid() {
    setIsLoading(true);
    const success = await _bid()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("BID SUCCESS: ", success);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />

        <button
          type="button"
          className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
          disabled={isBidInsufficient || isBalanceInsufficient || isLoading}
          onClick={bid}
        >
          {isLoading
            ? "Loading..."
            : isBidInsufficient
              ? "Insufficient bid"
              : isBalanceInsufficient
                ? "Insufficient balance"
                : "Bid"}
        </button>
      </div>

      <span>
        Minimum bid: {printNumber(fromUnits(minimumBid, decimals))} {symbol}
      </span>
      <span>
        Balance: {printNumber(fromUnits(balance, decimals))} {symbol}
      </span>
    </div>
  );
}
