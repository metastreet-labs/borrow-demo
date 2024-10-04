import type { Address, Hash } from "viem";
import { SSPO_POOLS } from "./constants";
import { getFabricaOracleContext } from "./getFabricaOracleContext";
import { getWatchesOracleContext } from "./getWatchesOracleContext";

export interface GetOracleContextParams {
  chainId: number;
  pool: Address;
  collateralToken: Address;
  collateralTokenId: string;
}

export async function getOracleContext(params: GetOracleContextParams): Promise<Hash> {
  const { chainId, pool } = params;

  const _pool = pool.toLowerCase() as Address;

  const sspo_pools = SSPO_POOLS[chainId];

  if (sspo_pools.watches == _pool) return getWatchesOracleContext(params);

  if (sspo_pools.fabrica.includes(_pool)) return getFabricaOracleContext(params);

  return "0x";
}
