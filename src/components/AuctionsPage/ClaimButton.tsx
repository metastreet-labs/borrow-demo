import { EACL_ABI } from "@/lib/abis/EACL";
import { Auction } from "@/lib/subgraph/auctions";
import { useState } from "react";
import { useChainId } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { wagmiConfig } from "../shared/Providers";
import { EACL_ADDRESS } from "./constants";

type Props = {
  auction: Auction;
};

export function ClaimButton(props: Props) {
  const { auction } = props;

  const chainId = useChainId();

  const eaclAddress = EACL_ADDRESS[chainId];

  async function _claim() {
    const hash = await writeContract(wagmiConfig, {
      address: eaclAddress,
      abi: EACL_ABI,
      functionName: "claim",
      args: [
        auction.liquidation.id,
        auction.collateralToken.id,
        BigInt(auction.collateralTokenId),
        auction.liquidation.loan.loanReceipt,
      ],
    });

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);

  async function claim() {
    setIsLoading(true);
    const success = await _claim()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("CLAIM SUCCESS: ", success);
  }

  return (
    <button type="button" className="bg-blue-500 text-white p-2 rounded-md" onClick={claim}>
      {isLoading ? "Loading..." : "Claim"}
    </button>
  );
}
