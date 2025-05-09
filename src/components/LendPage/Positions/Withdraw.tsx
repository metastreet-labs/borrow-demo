import { wagmiConfig } from "@/components/shared/Providers";
import { POOL_ABI } from "@/lib/abis/Pool";
import { fromUnits, printNumber } from "@/lib/shared/utils";
import { useState } from "react";
import { encodeFunctionData, Hash } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useDeposit } from "./DepositProvider";
import { RedemptionProgress } from "./redemptions";

export function Withdraw() {
  const { redemptionsProgress } = useDeposit();

  if (!redemptionsProgress) return <div>Loading redemption data...</div>;

  return <Withdraw_ redemptionsProgress={redemptionsProgress} />;
}

function Withdraw_(props: { redemptionsProgress: RedemptionProgress }) {
  const { redemptionsProgress } = props;
  const { deposit } = useDeposit();

  async function _withdraw() {
    let hash: Hash;

    if (deposit.redemptions.length > 1) {
      const calls = deposit.redemptions.map((redemption) =>
        encodeFunctionData({
          abi: POOL_ABI,
          functionName: "withdraw",
          args: [deposit.tick.raw, redemption.redemptionId],
        }),
      );

      hash = await writeContract(wagmiConfig, {
        address: deposit.pool.id,
        abi: POOL_ABI,
        functionName: "multicall",
        args: [calls],
      });
    } else {
      hash = await writeContract(wagmiConfig, {
        address: deposit.pool.id,
        abi: POOL_ABI,
        functionName: "withdraw",
        args: [deposit.tick.raw, deposit.redemptions[0].redemptionId],
      });
    }

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);
  async function withdraw() {
    setIsLoading(true);
    const success = await _withdraw()
      .then(() => true)
      .catch((e) => {
        console.error(e);
        return false;
      });
    setIsLoading(false);
    console.log("Withdraw success: ", success);
  }

  const { decimals, symbol } = deposit.pool.currencyToken;
  const p = (u: bigint) => `${printNumber(fromUnits(u, decimals))} ${symbol}`;

  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col text-sm font-medium grow">
        <span>Redemption progress: {redemptionsProgress.progressPercent * 100}%</span>
        <span>Remaining: {p(redemptionsProgress.amountRemaining)}</span>
        <span>Available: {p(redemptionsProgress.amountAvailable)}</span>
      </div>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
        onClick={withdraw}
        disabled={isLoading || !redemptionsProgress.amountAvailable}
      >
        {isLoading ? "Withdrawing..." : "Withdraw"}
      </button>
    </div>
  );
}
