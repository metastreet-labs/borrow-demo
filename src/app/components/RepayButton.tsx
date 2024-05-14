import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { POOL_ABI } from "../lib/abis/Pool";
import { Loan } from "../lib/subgraph/getLoans";
import { Pool } from "../lib/subgraph/getPool";
import { FixedPoint, fromUnits, printNumber } from "../lib/utils";
import { getLoanProratedRepayment } from "./Loans";
import { useWeb3, wagmiConfig } from "./Providers";

type RepayButtonProps = {
  loan: Loan;
  pool: Pool;
};

export function RepayButton(props: RepayButtonProps) {
  const { loan, pool } = props;

  const { currencyToken } = pool;

  const { connectedWalletAddress } = useWeb3();

  const { data: balance } = useReadContract(
    connectedWalletAddress
      ? {
          abi: erc20Abi,
          address: currencyToken.id,
          functionName: "balanceOf",
          args: [connectedWalletAddress],
        }
      : undefined,
  );

  const repayment = FixedPoint.scaleDown(
    getLoanProratedRepayment(loan),
    FixedPoint.DECIMALS - currencyToken.decimals,
    "up",
  );

  const isBalanceInsufficient = balance != undefined && balance < repayment;

  async function _repay() {
    if (!connectedWalletAddress) return;

    const allowance = await readContract(wagmiConfig, {
      abi: erc20Abi,
      address: currencyToken.id,
      functionName: "allowance",
      args: [connectedWalletAddress, pool.id],
    });

    const isApproved = allowance >= repayment;

    if (!isApproved) {
      const hash = await writeContract(wagmiConfig, {
        abi: erc20Abi,
        address: currencyToken.id,
        functionName: "approve",
        args: [pool.id, repayment],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
    }

    const hash = await writeContract(wagmiConfig, {
      abi: POOL_ABI,
      address: pool.id,
      functionName: "repay",
      args: [loan.loanReceipt],
    });
    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);

  async function repay() {
    setIsLoading(true);
    const success = await _repay()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("repay success: ", success);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="button"
        disabled={balance == undefined || isBalanceInsufficient || isLoading}
        onClick={repay}
      >
        {isLoading ? "Loading..." : "Repay"}
      </button>

      {isBalanceInsufficient ? (
        <span className="text-red-500">
          Insufficient balance: {printNumber(fromUnits(balance, currencyToken.decimals))}
        </span>
      ) : null}
    </div>
  );
}
