import { wagmiConfig } from "@/components/shared/Providers";
import { POOL_ABI } from "@/lib/abis/Pool";
import { fromInput, fromUnits, toUnits } from "@/lib/shared/utils";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useDeposit } from "./DepositProvider";

export function Redeem() {
  const { deposit } = useDeposit();

  const [shares, setShares] = useState("");
  const sharesUnits = toUnits(fromInput(shares));
  const isSharesInvalid = sharesUnits > deposit.shares;

  async function _redeem() {
    const hash = await writeContract(wagmiConfig, {
      address: deposit.pool.id,
      abi: POOL_ABI,
      functionName: "redeem",
      args: [deposit.tick.raw, sharesUnits],
    });
    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);
  async function redeem() {
    setIsLoading(true);
    const success = await _redeem()
      .then(() => true)
      .catch((e) => {
        console.error(e);
        return false;
      });
    setIsLoading(false);
    console.log("Redeem success: ", success);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xl font-bold">Redeem</h3>

      <div className="flex gap-2 items-start">
        <div className="flex flex-col flex-grow">
          <input
            type="number"
            className="w-full"
            placeholder="Enter shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShares(fromUnits(deposit.shares).toString())}
            className="text-sm text-blue-500 hover:text-blue-700 self-end"
          >
            Max
          </button>
        </div>

        <button
          type="button"
          className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
          disabled={isLoading || isSharesInvalid || !sharesUnits}
          onClick={redeem}
        >
          {isLoading ? "Redeeming..." : "Redeem"}
        </button>
      </div>
    </div>
  );
}
