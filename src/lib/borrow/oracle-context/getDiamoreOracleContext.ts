"use server";

import { z } from "zod";
import { zodAddress, zodHex, zodStringToNumber } from "../../shared/utils";
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
      timestamp: zodStringToNumber,
      duration: zodStringToNumber,
    }),
    signature: zodHex,
  })
  .transform((raw): Quote => {
    return {
      ...raw.quote,
      signature: raw.signature,
    };
  });

const BASE_URL = "https://api.price-oracle.dev.diamore.co/v1/metastreet/quotes";

export async function getDiamoreOracleContext(params: GetOracleContextParams) {
  const { collateralTokenId } = params;

  const response = await fetch(`${BASE_URL}/${collateralTokenId}`);

  const quote = schema.parse(await response.json());

  return encodeOracleContext(quote);
}
