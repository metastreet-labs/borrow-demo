import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { useState } from "react";
import { Hex, encodePacked, erc20Abi, size } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { POOL_ABI } from "../../lib/abis/Pool";
import { BorrowOption } from "../../lib/getBorrowOptions";
import { Loan } from "../../lib/subgraph/getLoans";
import { Pool } from "../../lib/subgraph/getPool";
import { FixedPoint, fromUnits, printNumber } from "../../lib/utils";
import { getLoanProratedRepayment } from "../Loans";
import { wagmiConfig } from "../Providers";

type RefinanceButtonProps = {
  pool: Pool;
  loan: Loan;
  borrowOption: BorrowOption;
  oracleContext: Hex;
};

export function RefinanceButton(props: RefinanceButtonProps) {
  const { pool, loan, borrowOption, oracleContext } = props;

  const { address: connectedWalletAddress } = useAccount();

  const downpayment = FixedPoint.scaleDown(
    getLoanProratedRepayment(loan) - borrowOption.principal,
    FixedPoint.DECIMALS - pool.currencyToken.decimals,
    "up",
  );

  const { data: balance } = useReadContract(
    connectedWalletAddress
      ? {
          abi: erc20Abi,
          address: pool.currencyToken.id,
          functionName: "balanceOf",
          args: [connectedWalletAddress],
        }
      : undefined,
  );

  const isBalanceInsufficient = balance != undefined && balance < downpayment;

  async function _refinance() {
    if (!connectedWalletAddress) return;

    if (downpayment > 0n) {
      const allowance = await readContract(wagmiConfig, {
        abi: erc20Abi,
        address: pool.currencyToken.id,
        functionName: "allowance",
        args: [connectedWalletAddress, pool.id],
      });

      if (allowance < downpayment) {
        const hash = await writeContract(wagmiConfig, {
          abi: erc20Abi,
          address: pool.currencyToken.id,
          functionName: "approve",
          args: [pool.id, downpayment],
        });

        await waitForTransactionReceipt(wagmiConfig, { hash });
      }
    }

    const hash = await writeContract(wagmiConfig, {
      abi: POOL_ABI,
      address: pool.id,
      functionName: "refinance",
      args: [
        loan.loanReceipt,
        FixedPoint.scaleDown(
          borrowOption.principal,
          FixedPoint.DECIMALS - pool.currencyToken.decimals,
        ),
        BigInt(borrowOption.duration),
        FixedPoint.scaleDown(
          borrowOption.repayment,
          FixedPoint.DECIMALS - pool.currencyToken.decimals,
          "up",
        ),
        borrowOption.nodes,
        encodePacked(["uint16", "uint16", "bytes"], [5, size(oracleContext), oracleContext]),
      ],
    });

    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  const [isLoading, setIsLoading] = useState(false);

  async function refinance() {
    setIsLoading(true);
    const success = await _refinance()
      .then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
    setIsLoading(false);
    console.log("refinance success:", success);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={balance == undefined || isBalanceInsufficient}
        onClick={refinance}
        type="button"
        className="button"
      >
        {isLoading ? "Loading..." : "Refinance"}
      </button>

      {isBalanceInsufficient ? (
        <span className="text-red-500">
          Insufficient balance for downpayment:{" "}
          {printNumber(fromUnits(downpayment, pool.currencyToken.decimals))}{" "}
          {pool.currencyToken.symbol}
        </span>
      ) : undefined}
    </div>
  );
}
