import { Pool } from "@/lib/subgraph/getPool";
import { createContext, ReactNode, useContext } from "react";

const PoolContext = createContext<Pool | undefined>(undefined);

export function usePool() {
  const pool = useContext(PoolContext);
  if (!pool) throw new Error("Pool not found");
  return pool;
}

type Params = {
  pool: Pool;
  children: ReactNode;
};

export function PoolProvider(params: Params) {
  const { pool, children } = params;

  return <PoolContext.Provider value={pool}>{children}</PoolContext.Provider>;
}
