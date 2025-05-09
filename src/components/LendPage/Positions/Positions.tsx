import { fromUnits, printNumber } from "@/lib/shared/utils";
import { Deposit, getDeposits } from "@/lib/subgraph/getDeposits";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePool } from "../PoolProvider";
import { decodeTick } from "../tick/tickCodec";
import { printDuration, printLimit, printRate } from "../utils";
import { DepositProvider } from "./DepositProvider";
import { PositionEvents } from "./PositionEvents";
import { Redeem } from "./Redeem";
import { useRedemptionsProgress } from "./redemptions";
import { Withdraw } from "./Withdraw";

export function Positions() {
  const chainId = useChainId();
  const { address: account } = useAccount();

  const pool = usePool();

  const { data, error } = useQuery({
    queryKey: ["deposits", chainId, pool.id, account] as const,
    queryFn: async ({ queryKey }) => {
      const [, chainId, pool, account] = queryKey;

      if (!account) throw new Error("Account not found");

      return getDeposits({ chainId, pool, account });
    },
    enabled: Boolean(account),
  });

  const redemptionsProgress = useRedemptionsProgress(data);

  const [selectedDeposit, setSelectedDeposit] = useState<Deposit>();

  let depositsNode;
  if (!data) {
    if (error) depositsNode = <span className="text-red-500">{error.message}</span>;
    else depositsNode = <span className="text-gray-500">Loading...</span>;
  } else {
    if (!data.length) depositsNode = <span className="text-gray-500">No positions</span>;
    else
      depositsNode = (
        <div className="flex flex-col gap-2">
          {data.map((deposit, idx) => {
            const { limit, limitType, rateIndex, durationIndex } = decodeTick(deposit.tick.raw);
            const isSelected = selectedDeposit?.id == deposit.id;
            return (
              <button
                className={`flex flex-col border rounded p-4 ${isSelected ? "bg-blue-500" : ""}`}
                key={idx}
                onClick={() => setSelectedDeposit(deposit)}
              >
                <span>Shares: {printNumber(fromUnits(deposit.shares))}</span>
                <span>Rate: {printRate(pool.rates[rateIndex])}</span>
                <span>Duration: {printDuration(pool.durations[durationIndex])}</span>
                <span>Loan Limit: {printLimit(limit, limitType, pool.currencyToken.symbol)}</span>
              </button>
            );
          })}
        </div>
      );
  }

  let manageDepositNode;
  if (!selectedDeposit)
    manageDepositNode = (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-gray-500">Select a position</span>
      </div>
    );
  else
    manageDepositNode = (
      <DepositProvider
        deposit={selectedDeposit}
        redemptionsProgress={redemptionsProgress[selectedDeposit.id]}
      >
        <div className="flex w-full h-full">
          <PositionEvents />

          <div className="flex flex-col gap-2 flex-grow">
            <Redeem />
            <Withdraw />
          </div>
        </div>
      </DepositProvider>
    );

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg gap-4">
      <h3 className="text-xl font-bold self-start">Positions</h3>

      <div className="flex gap-4 self-stretch">
        <div className="flex flex-col min-w-64">{depositsNode}</div>
        <div className="flex flex-col flex-grow">{manageDepositNode}</div>
      </div>
    </div>
  );
}
