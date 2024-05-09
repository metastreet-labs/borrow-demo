"use client";

import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { Hash, encodePacked, erc721Abi, size } from "viem";
import { useAccount } from "wagmi";
import { POOL_ABI } from "../lib/abi";
import { BorrowOption } from "../lib/getBorrowOptions";
import { Pool } from "../lib/getPool";
import { FixedPoint } from "../lib/utils";
import { wagmiConfig } from "./Providers";

type BorrowButtonProps = {
  pool: Pool;
  tokenId: string;
  borrowOption: BorrowOption;
  oracleContext: Hash;
};

export function BorrowButton(props: BorrowButtonProps) {
  const { pool, borrowOption, oracleContext, tokenId } = props;

  const { address: connectedWalletAddress } = useAccount();

  const [isLoading, setIsLoading] = useState(false);

  async function _borrow() {
    if (!connectedWalletAddress) return;

    /* Check if NFT collection is approved by connected wallet address */
    const isApproved = await readContract(wagmiConfig, {
      abi: erc721Abi,
      address: pool.collateralToken.id,
      functionName: "isApprovedForAll",
      args: [connectedWalletAddress, pool.id],
    });

    /* Send approval transaction if collection is not approved */
    if (!isApproved) {
      const hash = await writeContract(wagmiConfig, {
        abi: erc721Abi,
        address: pool.collateralToken.id,
        functionName: "setApprovalForAll",
        args: [pool.id, true],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const { decimals } = pool.currencyToken;
    const { principal, repayment, duration, nodes } = borrowOption;

    /* protect user by reverting the transaction if repayment exceeds this value */
    const maxRepayment = principal + (10_500n * (repayment - principal)) / 10_000n;

    /* Send borrow transaction */
    const hash = await writeContract(wagmiConfig, {
      abi: POOL_ABI,
      address: pool.id,
      functionName: "borrow",
      args: [
        /* SDK returns 18 decimal values, must scale down to currency decimals */
        FixedPoint.scaleDown(principal, FixedPoint.DECIMALS - decimals),
        BigInt(duration),
        pool.collateralToken.id,
        BigInt(tokenId),
        /* down scaling required here too, must round "up" */
        FixedPoint.scaleDown(maxRepayment, FixedPoint.DECIMALS - decimals, "up"),
        nodes,
        encodePacked(["uint16", "uint16", "bytes"], [5, size(oracleContext), oracleContext]),
      ],
    });

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  async function borrow() {
    setIsLoading(true);
    const success = await _borrow()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("BORROW SUCCESS: ", success);
  }

  if (!connectedWalletAddress) return <span>Connect wallet</span>;

  return (
    <button className="border bg-black text-white p-4" onClick={borrow} disabled={isLoading}>
      {isLoading ? "Loading..." : "Borrow"}
    </button>
  );
}
