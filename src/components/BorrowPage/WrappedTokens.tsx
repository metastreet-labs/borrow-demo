"use client";

import { ERC1155CW_ABI } from "@/lib/abis/ERC1155Cw";
import { COLLATERAL_WRAPPERS } from "@/lib/borrow/collateral-wrappers";
import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { getPool } from "@/lib/subgraph/getPool";
import { getWrappedTokens, WrappedToken } from "@/lib/subgraph/getWrappedTokens";
import { useQuery } from "@tanstack/react-query";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { erc721Abi, isAddress } from "viem";
import { useWeb3, wagmiConfig } from "../shared/Providers";

export function WrappedTokens() {
  const { connectedWalletAddress, chainId } = useWeb3();

  const sp = useSearchParamsMutation();
  const pool = sp.get("pool") ?? "";

  const isPoolValidAddress = isAddress(pool);

  const { data, error } = useQuery({
    queryKey: ["wrapped-tokens", pool, connectedWalletAddress, chainId] as const,
    queryFn: async ({ queryKey }) => {
      const [, poolAddress, account, chainId] = queryKey;

      if (!isAddress(poolAddress) || !account) throw new Error("Invalid params");

      const pool = await getPool({ chainId, poolAddress });

      return getWrappedTokens({ chainId, account, collection: pool.collateralToken.id });
    },
    enabled: Boolean(isPoolValidAddress && connectedWalletAddress),
  });

  let children;

  if (!data) {
    if (!connectedWalletAddress) children = <span>Connect your wallet</span>;
    else if (!isPoolValidAddress) children = <span>Enter a valid pool address</span>;
    else if (error) children = <span className="text-red-500">Error: {error.message}</span>;
    else children = <span className="text-gray-500">Loading...</span>;
  } else {
    if (!data.length) children = <span className="text-gray-500">You have no wrapped tokens</span>;
    else {
      children = data.map((wrappedToken, idx) => (
        <WrappedTokenCard key={idx} wrappedToken={wrappedToken} />
      ));
    }
  }

  return (
    <div className="flex flex-col">
      <h2>Wrapped Tokens</h2>
      {children}
    </div>
  );
}

type Props = {
  wrappedToken: WrappedToken;
};

function WrappedTokenCard(props: Props) {
  const { wrappedToken } = props;
  const { id, underlyingCollateralTokenIds, quantities } = wrappedToken;

  const _unwrap = useUnwrapToken(wrappedToken);

  const [isLoading, setIsLoading] = useState(false);
  async function unwrap() {
    setIsLoading(true);

    await _unwrap()
      .then(() => console.log("Unwrap success"))
      .catch((e) => console.log("Unwrap failed", e));

    setIsLoading(false);
  }

  return (
    <div className="flex flex-col p-4 border rounded w-64 text-sm">
      <span className="truncate">Wrapped token: {`${id}`}</span>
      <span>Underlying:</span>
      <ul className="flex flex-col gap-1 list-disc list-inside">
        {underlyingCollateralTokenIds.map((id, idx) => (
          <li key={idx} className="truncate">{`${quantities[idx]} x ${id}`}</li>
        ))}
      </ul>

      <button
        className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        disabled={isLoading}
        onClick={unwrap}
      >
        {isLoading ? "Unwrapping..." : "Unwrap"}
      </button>
    </div>
  );
}

export function useUnwrapToken(wrappedToken: WrappedToken) {
  const { connectedWalletAddress, chainId } = useWeb3();
  const cw = COLLATERAL_WRAPPERS[chainId];

  return async function unwrapToken() {
    if (!connectedWalletAddress) throw new Error("Not connected");

    const isApproved = await readContract(wagmiConfig, {
      abi: erc721Abi,
      address: cw.erc1155,
      functionName: "isApprovedForAll",
      args: [connectedWalletAddress, cw.erc1155],
    });

    if (!isApproved) {
      const hash = await writeContract(wagmiConfig, {
        abi: erc721Abi,
        address: cw.erc1155,
        functionName: "setApprovalForAll",
        args: [cw.erc1155, true],
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const hash = await writeContract(wagmiConfig, {
      abi: ERC1155CW_ABI,
      address: cw.erc1155,
      functionName: "unwrap",
      args: [wrappedToken.id, wrappedToken.collateralWrapperContext],
    });

    await waitForTransactionReceipt(wagmiConfig, { hash });
  };
}
