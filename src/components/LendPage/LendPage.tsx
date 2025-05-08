"use client";

import {
  decodeTick,
  denormalizeTickRate,
  encodeTick,
  TickLimitType,
} from "@/components/LendPage/tick/tickCodec";
import { useSearchParamsMutation } from "@/lib/shared/useSearchParamsMutation";
import { fromInput, fromUnits, printNumber, toUnits } from "@/lib/shared/utils";
import { getPool } from "@/lib/subgraph/getPool";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useMemo, useState } from "react";
import { erc20Abi, isAddress } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { PoolProvider, usePool } from "./PoolProvider";
import { getClosestValidLimit } from "./tick/getClosestValidLimit";
import { useDepositTx } from "./useDepositTx";

export function LendPage() {
  const chainId = useChainId();
  const sp = useSearchParamsMutation();

  const poolAddress = sp.get("pool");

  const { data, error } = useQuery({
    queryKey: ["lend-pool", chainId, poolAddress] as const,
    queryFn: ({ queryKey }) => {
      const [, chainId, poolAddress] = queryKey;

      if (!poolAddress || !isAddress(poolAddress)) throw new Error("Invalid pool address");

      return getPool({ chainId, poolAddress });
    },
    enabled: Boolean(poolAddress && isAddress(poolAddress)),
  });

  let child: ReactNode;

  if (!data) {
    if (error) child = <span className="text-red-500">{error.message}</span>;
    else child = <span>Loading...</span>;
  } else {
    child = (
      <PoolProvider pool={data}>
        <Lend />
      </PoolProvider>
    );
  }

  return (
    <div className="flex flex-col">
      <input
        value={poolAddress ?? ""}
        onChange={(e) => sp.set("pool", e.target.value)}
        placeholder="Pool address"
        className="mb-4"
      />
      {child}
    </div>
  );
}

function Lend() {
  const {
    ticks,
    durations,
    rates,
    currencyToken: { id: currencyAddress, symbol, decimals },
  } = usePool();

  const { address: account } = useAccount();

  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0);
  const [selectedRateIdx, setSelectedRateIdx] = useState(0);
  const [selectedLimitType, setSelectedLimitType] = useState(TickLimitType.Absolute);
  const [_selectedLimit, _setSelectedLimit] = useState("");

  const { selectedLimit, isLimitInvalid } = useMemo(() => {
    let selectedLimit;
    // if absolute, convert to fixed point decimal
    if (selectedLimitType == TickLimitType.Absolute)
      selectedLimit = toUnits(fromInput(_selectedLimit));
    // if ratio, convert to basis points
    else selectedLimit = BigInt(fromInput(_selectedLimit).mul(100).toString());

    const closestValidLimit = getClosestValidLimit({
      limit: selectedLimit,
      limitType: selectedLimitType,
      ticks: ticks.map((t) => t.raw),
    });

    return { selectedLimit, isLimitInvalid: closestValidLimit != selectedLimit };
  }, [_selectedLimit, selectedLimitType, ticks]);

  const selectedTick = encodeTick({
    limit: selectedLimit,
    limitType: selectedLimitType,
    durationIndex: selectedDurationIdx,
    rateIndex: selectedRateIdx,
  });

  const [amount, setAmount] = useState("");
  const amountUnits = toUnits(fromInput(amount), decimals);

  const { data: balance } = useReadContract({
    address: currencyAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account && [account],
  });
  const isBalanceInsufficient = Boolean(balance && amountUnits && balance < amountUnits);

  const { deposit, isLoading } = useDepositTx({ tick: selectedTick, amount: amountUnits });

  const isDepositButtonDisabled =
    !selectedLimit || isLimitInvalid || !amountUnits || isBalanceInsufficient || isLoading;

  function printRate(rate: bigint) {
    return `${Math.round(denormalizeTickRate(rate) * 100)}%`;
  }

  function printDuration(duration: number) {
    return `${Math.round(duration / 86400)}d`;
  }

  function printLimit(limit: bigint, limitType: TickLimitType) {
    if (limitType == TickLimitType.Absolute) return `${printNumber(fromUnits(limit))} ${symbol}`;
    else return `${Number(limit) / 100}% LTV`;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-8">
        <div className="flex flex-col">
          <span className="font-semibold">Select duration</span>
          <div className="flex flex-wrap w-64 gap-1">
            {durations.map((duration, idx) => {
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDurationIdx(idx)}
                  className={`p-1 border ${selectedDurationIdx == idx ? "bg-blue-500" : ""}`}
                >
                  {printDuration(duration)}
                </button>
              );
            })}
          </div>

          <span className="font-semibold mt-4">Select rate</span>
          <div className="flex flex-wrap w-64 gap-1">
            {rates.map((rate, idx) => {
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedRateIdx(idx)}
                  className={`p-1 border ${selectedRateIdx == idx ? "bg-blue-500" : ""}`}
                >
                  {printRate(rate)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-4 mb-2">
            <span className="font-semibold">Enter Loan Limit</span>

            <button
              className={`p-1 border ${selectedLimitType == TickLimitType.Absolute ? "bg-blue-500" : ""}`}
              onClick={() => setSelectedLimitType(TickLimitType.Absolute)}
            >
              Absolute
            </button>

            <button
              className={`p-1 border ${selectedLimitType == TickLimitType.Ratio ? "bg-blue-500" : ""}`}
              onClick={() => setSelectedLimitType(TickLimitType.Ratio)}
            >
              Ratio
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-36"
              value={_selectedLimit}
              onChange={(e) => _setSelectedLimit(e.target.value)}
            />
            <span>{selectedLimitType == TickLimitType.Absolute ? symbol : "% LTV"}</span>
          </div>
          {isLimitInvalid && <span className="text-red-500">Invalid limit</span>}
        </div>

        <span className="font-bold">OR</span>

        <div className="flex flex-col">
          <span className="font-semibold">Select existing tick</span>

          <div className="flex flex-col gap-2">
            {ticks.map((tick, idx) => {
              const { limit, limitType, rateIndex, durationIndex } = decodeTick(tick.raw);

              const isSelected = selectedTick == tick.raw;

              return (
                <button
                  key={idx}
                  className={`p-1 border ${isSelected ? "bg-blue-500" : ""}`}
                  onClick={() => {
                    setSelectedDurationIdx(durationIndex);
                    setSelectedRateIdx(rateIndex);
                    setSelectedLimitType(limitType);

                    const limitStr =
                      limitType == TickLimitType.Absolute
                        ? fromUnits(limit).toString()
                        : `${Number(limit) / 100}`;
                    _setSelectedLimit(limitStr);
                  }}
                >
                  {printLimit(limit, limitType)}, {printRate(rates[rateIndex])},{" "}
                  {printDuration(durations[durationIndex])}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
