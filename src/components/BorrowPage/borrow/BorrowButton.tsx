"use client";

import { useWeb3, wagmiConfig } from "@/components/shared/Providers";
import { ERC1155CW_ABI } from "@/lib/abis/ERC1155Cw";
import { POOL_ABI } from "@/lib/abis/Pool";
import { getMaxRepayment } from "@/lib/borrow/calcs";
import { COLLATERAL_WRAPPERS } from "@/lib/borrow/collateral-wrappers";
import { encodeBorrowOptions } from "@/lib/borrow/encodeBorrowOptions";
import { BorrowOption } from "@/lib/borrow/getBorrowOptions";
import { extractEvents } from "@/lib/shared/extractEvent";
import { FixedPoint } from "@/lib/shared/utils";
import { Pool } from "@/lib/subgraph/getPool";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { Hash, erc721Abi } from "viem";

type BorrowButtonProps = {
  pool: Pool;
  tokenId: string;
  quantity: number;
  borrowOption: BorrowOption;
  oracleContext: Hash;
};

export function BorrowButton(props: BorrowButtonProps) {
  const { pool, borrowOption, oracleContext, tokenId, quantity } = props;

  const { connectedWalletAddress, chainId } = useWeb3();

  const cw = COLLATERAL_WRAPPERS[chainId];

  const [isLoading, setIsLoading] = useState(false);

  async function _borrow() {
    if (!connectedWalletAddress) return;

    let token = {
      address: pool.collateralToken.id,
      id: BigInt(tokenId),
      collateralWrapperContext: undefined as Hash | undefined,
    };

    if (pool.isERC1155Pool && quantity > 1) {
      console.log("Token is ERC1155 with quantity > 1");

      const isApproved = await readContract(wagmiConfig, {
        abi: erc721Abi,
        address: pool.collateralToken.id,
        functionName: "isApprovedForAll",
        args: [connectedWalletAddress, cw.erc1155],
      });

      if (!isApproved) {
        console.log("Approving ERC1155 Collateral Wrapper");
        const hash = await writeContract(wagmiConfig, {
          abi: erc721Abi,
          address: pool.collateralToken.id,
          functionName: "setApprovalForAll",
          args: [cw.erc1155, true],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash });
      }

      console.log("Batching token");
      const hash = await writeContract(wagmiConfig, {
        abi: ERC1155CW_ABI,
        address: cw.erc1155,
        functionName: "mint",
        args: [pool.collateralToken.id, [BigInt(tokenId)], [BigInt(quantity)]],
      });
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      const events = extractEvents({ receipt, abi: ERC1155CW_ABI, eventName: "BatchMinted" });
      token = {
        address: cw.erc1155,
        id: events[0].args.tokenId,
        collateralWrapperContext: events[0].args.encodedBatch,
      };
    }

    /* Check if NFT collection is approved by connected wallet address */
    const isApproved = await readContract(wagmiConfig, {
      abi: erc721Abi,
      address: token.address,
      functionName: "isApprovedForAll",
      args: [connectedWalletAddress, pool.id],
    });

    /* Send approval transaction if collection is not approved */
    if (!isApproved) {
      const hash = await writeContract(wagmiConfig, {
        abi: erc721Abi,
        address: token.address,
        functionName: "setApprovalForAll",
        args: [pool.id, true],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const { decimals } = pool.currencyToken;
    const { principal, repayment, duration, nodes } = borrowOption;

    /* protect user by reverting the transaction if repayment exceeds this value */
    const maxRepayment = getMaxRepayment(principal, repayment);

    /* Send borrow transaction */
    const hash = await writeContract(wagmiConfig, {
      abi: POOL_ABI,
      address: pool.id,
      functionName: "borrow",
      args: [
        /* SDK returns 18 decimal values, must scale down to currency decimals */
        FixedPoint.scaleDown(principal, FixedPoint.DECIMALS - decimals),
        BigInt(duration),
        token.address,
        token.id,
        /* down scaling required here too, must round "up" */
        FixedPoint.scaleDown(maxRepayment, FixedPoint.DECIMALS - decimals),
        nodes,
        encodeBorrowOptions({
          oracleContext,
          collateralWrapperContext: token.collateralWrapperContext,
          delegateCashV2Address: undefined,
        }),
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
    <button className="button" onClick={borrow} disabled={isLoading} type="button">
      {isLoading ? "Loading..." : "Borrow"}
    </button>
  );
}
