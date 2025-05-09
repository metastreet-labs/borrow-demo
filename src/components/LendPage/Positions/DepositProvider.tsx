import { Deposit } from "@/lib/subgraph/getDeposits";
import { createContext, PropsWithChildren, useContext } from "react";
import { RedemptionProgress } from "./redemptions";

type DepositContextType = {
  deposit: Deposit;
  redemptionsProgress: RedemptionProgress | undefined;
};

const DepositContext = createContext<DepositContextType | undefined>(undefined);

export function useDeposit() {
  const deposit = useContext(DepositContext);
  if (!deposit) throw new Error("Deposit not found");
  return deposit;
}

export function DepositProvider(props: PropsWithChildren<DepositContextType>) {
  const { children, ...rest } = props;

  return <DepositContext.Provider value={rest}>{children}</DepositContext.Provider>;
}
