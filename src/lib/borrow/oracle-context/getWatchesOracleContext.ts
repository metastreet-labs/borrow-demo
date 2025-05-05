import { base, sepolia } from "viem/chains";
import { z } from "zod";
import { zodAddress, zodHex } from "../../shared/utils";
import type { Quote } from "./encodeOracleContext";
import { encodeOracleContext } from "./encodeOracleContext";
import type { GetOracleContextParams } from "./getOracleContext";

const schema = z
  .object({
    token: zodAddress,
    tokenId: z.string(),
    currency: zodAddress,
    price: z.number(),
    timestamp: z.number(),
    duration: z.number(),
    signature: z.object({
      messageHash: z.string(),
      r: z.number(),
      s: z.number(),
      v: z.number(),
      signature: zodHex,
    }),
  })
  .transform((raw): Quote => {
    return {
      ...raw,
      price: raw.price.toString(),
      signature: raw.signature.signature,
    };
  });

const WATCHES_API_URL: Record<number, string> = {
  [base.id]: "https://api.watches.io",
  [sepolia.id]: "https://api-dev.horodex.io",
};

export async function getWatchesOracleContext(params: GetOracleContextParams) {
  const { chainId, collateralTokenId } = params;

  const response = await fetch(
    `${WATCHES_API_URL[chainId]}/public/marketplace/physical-watch/token/quote?token_id=${collateralTokenId}`,
  );

  const quote = schema.parse(await response.json());

  return encodeOracleContext(quote);
}
