"use server";

import { mainnet, sepolia } from "viem/chains";
import { z } from "zod";
import { zodAddress, zodHex } from "../utils";
import type { Quote } from "./encodeOracleContext";
import { encodeOracleContext } from "./encodeOracleContext";
import type { GetOracleContextParams } from "./getOracleContext";

const schema = z
  .object({
    quote: z.object({
      token: zodAddress,
      tokenId: z.string(),
      currency: zodAddress,
      price: z.string(),
      timestamp: z.number(),
      duration: z.number(),
    }),
    signature: zodHex,
  })
  .transform((raw): Quote => {
    return {
      ...raw.quote,
      signature: raw.signature,
    };
  });

const BASE_URL = "https://api3.fabrica.land/meta-street";

const CHAINS: Record<number, string> = {
  [mainnet.id]: "mainnet",
  [sepolia.id]: "sepolia",
};

export async function getFabricaOracleContext(params: GetOracleContextParams) {
  const { chainId, pool, collateralToken, collateralTokenId } = params;

  const response = await fetch(
    `${BASE_URL}/${CHAINS[chainId]}/${pool}/${collateralToken}/${collateralTokenId}/signed-valuation`,
  );

  const quote = schema.parse(await response.json());

  return encodeOracleContext(quote);
}
