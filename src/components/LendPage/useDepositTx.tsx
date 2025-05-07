import { POOL_ABI } from "@/lib/abis/Pool";
import { FixedPoint } from "@/lib/shared/utils";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { encodeFunctionData, erc20Abi, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { wagmiConfig } from "../shared/Providers";
import { usePool } from "./PoolProvider";

interface UseDepositTransactionParams {
  tick: bigint;
  amount: bigint;
}

export function useDepositTx(params: UseDepositTransactionParams) {
  const pool = usePool();

  const { tick, amount } = params;

  const { address: account } = useAccount();

  async function _deposit() {
    if (!account) throw new Error("No account");

    const allowance = await readContract(wagmiConfig, {
      address: pool.currencyToken.id,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account, pool.id],
    });

    if (allowance < amount) {
      console.log("Insufficient allowance, approving...");

      const hash = await writeContract(wagmiConfig, {
        address: pool.currencyToken.id,
        abi: erc20Abi,
        functionName: "approve",
        args: [pool.id, amount],
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const depositSharePrice = await readContract(wagmiConfig, {
      address: pool.id,
      abi: POOL_ABI,
      functionName: "depositSharePrice",
      args: [tick],
    });

    const minShares = calculateMinShares({
      amount,
      depositSharePrice,
      decimals: pool.currencyToken.decimals,
    });

    const depositToken = await readContract(wagmiConfig, {
      address: pool.id,
      abi: POOL_ABI,
      functionName: "depositToken",
      args: [tick],
    });

    if (depositToken == zeroAddress) {
      console.log("Tick must be tokenized before deposit, multicalling tokenize + deposit...");
    } else {
      console.log("Tick already tokenized, depositing directly...");
    }

    const depositTx =
      depositToken != zeroAddress
        ? /* Tick already tokenized, can deposit directly */
          writeContract(wagmiConfig, {
            address: pool.id,
            abi: POOL_ABI,
            functionName: "deposit",
            args: [tick, amount, minShares],
          })
        : /* Tick must be tokenized before deposit */
          writeContract(wagmiConfig, {
            address: pool.id,
            abi: POOL_ABI,
            functionName: "multicall",
            args: [
              [
                encodeFunctionData({
                  abi: POOL_ABI,
                  functionName: "tokenize",
                  args: [tick],
                }),
                encodeFunctionData({
                  abi: POOL_ABI,
                  functionName: "deposit",
                  args: [tick, amount, minShares],
                }),
              ],
            ],
          });

    const hash = await depositTx;
    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);

  async function deposit() {
    setIsLoading(true);
    const success = await _deposit()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("DEPOSIT SUCCESS: ", success);
  }

  return { deposit, isLoading };
}

interface CalculateMinSharesParams {
  amount: bigint;
  depositSharePrice: bigint | undefined;
  decimals: number;
}

export function calculateMinShares(params: CalculateMinSharesParams) {
  const { amount, depositSharePrice, decimals } = params;

  if (!depositSharePrice) return 0n;

  const expectedShares = FixedPoint.scaleUp(
    FixedPoint.div(amount, depositSharePrice, decimals),
    18 - decimals,
  );
  // apply 1% slippage + round up
  return (expectedShares * 9_900n + 5_000n) / 10_000n;
}
