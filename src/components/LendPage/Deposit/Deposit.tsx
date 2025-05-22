import { fromInput, toUnits } from "@/lib/shared/utils";
import { useState } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { usePool } from "../PoolProvider";
import { PickedTick, TickPicker } from "../TickPicker";
import { useDepositTx } from "./useDepositTx";

export function Deposit() {
  const pool = usePool();
  const {
    currencyToken: { id: currencyAddress, symbol, decimals },
  } = pool;

  const { address: account } = useAccount();

  const [selectedTick, setSelectedTick] = useState<PickedTick>({ tick: 0n, isLimitInvalid: false });

  const [amount, setAmount] = useState("");
  const amountUnits = toUnits(fromInput(amount), decimals);

  const { data: balance } = useReadContract({
    address: currencyAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account && [account],
  });
  const isBalanceInsufficient = Boolean(balance && amountUnits && balance < amountUnits);

  const { deposit, isLoading } = useDepositTx({ tick: selectedTick.tick, amount: amountUnits });

  const isDepositButtonDisabled =
    selectedTick.isLimitInvalid || !amountUnits || isBalanceInsufficient || isLoading;

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg">
      <h3 className="text-xl font-bold self-start">Deposit</h3>

      <TickPicker pool={pool} selectedTick={selectedTick} onTickSelected={setSelectedTick} />

      <span className="mt-4 font-semibold">Enter amount to lend</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          className="w-36"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span>{symbol}</span>
      </div>

      <button
        disabled={isDepositButtonDisabled}
        onClick={deposit}
        className="text-lg p-2 rounded bg-green-500 disabled:opacity-50 w-64 mt-4"
      >
        {isLoading ? "Depositing..." : "Deposit"}
      </button>
      {isBalanceInsufficient && <span className="text-red-500">Insufficient balance</span>}
    </div>
  );
}
