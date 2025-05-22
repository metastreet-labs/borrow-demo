import { wagmiConfig } from "@/components/shared/Providers";
import { POOL_ABI } from "@/lib/abis/Pool";
import { readContracts, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { encodeFunctionData, Hash, Hex, zeroAddress } from "viem";
import { calculateMinShares } from "../Deposit/useDepositTx";
import { PickedTick, TickPicker } from "../TickPicker";
import { useDeposit } from "./DepositProvider";
import { useRedemptionsAvailable } from "./redemptions/useRedemptionsAvailable";

export function Rebalance() {
  const { redemptionsProgress } = useDeposit();

  let children = null;

  if (!redemptionsProgress) children = <span className="text-gray-500">Loading...</span>;
  else if (!redemptionsProgress.amountAvailable)
    children = <span className="text-gray-500">Nothing to rebalance</span>;
  else children = <_Rebalance />;

  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold">Rebalance</span>
      {children}
    </div>
  );
}

function _Rebalance() {
  const { deposit } = useDeposit();
  const redemptionsAvailable = useRedemptionsAvailable([deposit])?.[deposit.id];

  const [selectedTick, setSelectedTick] = useState<PickedTick>({ tick: 0n, isLimitInvalid: false });

  async function _rebalance() {
    if (!redemptionsAvailable?.length) return;

    const { decimals } = deposit.pool.currencyToken;

    const minShares = (idx: number) => {
      return calculateMinShares({
        amount: redemptionsAvailable[idx].amount,
        depositSharePrice,
        decimals,
      });
    };

    const [token, depositSharePrice] = await readContracts(wagmiConfig, {
      contracts: [
        {
          address: deposit.pool.id,
          abi: POOL_ABI,
          functionName: "depositToken",
          args: [selectedTick.tick],
        },
        {
          address: deposit.pool.id,
          abi: POOL_ABI,
          functionName: "depositSharePrice",
          args: [selectedTick.tick],
        },
      ],
      allowFailure: false,
    });

    let hash: Hash;

    if (token == zeroAddress || redemptionsAvailable.length > 1) {
      // multicall
      const calls: Hex[] = [];

      if (token == zeroAddress) {
        console.log("Tick must be tokenized before deposit, will add tokenize to the multicall...");
        calls.push(
          encodeFunctionData({
            abi: POOL_ABI,
            functionName: "tokenize",
            args: [selectedTick.tick],
          }),
        );
      }

      for (let i = 0; i < deposit.redemptions.length; i++) {
        calls.push(
          encodeFunctionData({
            abi: POOL_ABI,
            functionName: "rebalance",
            args: [
              deposit.tick.raw,
              selectedTick.tick,
              deposit.redemptions[i].redemptionId,
              minShares(i),
            ],
          }),
        );
      }

      hash = await writeContract(wagmiConfig, {
        address: deposit.pool.id,
        abi: POOL_ABI,
        functionName: "multicall",
        args: [calls],
      });
    } else {
      console.log("No need for multicall, rebalance directly...");

      hash = await writeContract(wagmiConfig, {
        address: deposit.pool.id,
        abi: POOL_ABI,
        functionName: "rebalance",
        args: [
          deposit.tick.raw,
          selectedTick.tick,
          deposit.redemptions[0].redemptionId,
          minShares(0),
        ],
      });
    }

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);
  async function rebalance() {
    setIsLoading(true);
    await _rebalance()
      .then(() => console.log("REBALANCE SUCCESS"))
      .catch((e) => console.log("REBALANCE FAILED: ", e));
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col">
      <TickPicker
        pool={deposit.pool}
        selectedTick={selectedTick}
        onTickSelected={setSelectedTick}
      />

      <button
        onClick={rebalance}
        disabled={isLoading || selectedTick.isLimitInvalid}
        className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50 mt-4"
      >
        {isLoading ? "Rebalancing..." : "Rebalance"}
      </button>
    </div>
  );
}
