"use server";

import { sepolia } from "viem/chains";
import { z } from "zod";
import { GetOracleContextParams } from ".";
import { zodAddress, zodHex, zodStringToNumber } from "../utils";
import { encodeOracleContext, Quote } from "./encodeOracleContext";

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

const API_URL: Record<number, string> = {
  [sepolia.id]: "https://dev.estateprotocol.com/api/public/property/metastreet-quotes",
};

export async function getEstateOracleContext(params: GetOracleContextParams) {
  const { chainId, collateralTokenId } = params;

  const url = API_URL[chainId];

  if (!url) throw new Error("Invalid chainId");

  const response = await fetch(`${url}?tokenId=${collateralTokenId}`);
  const json = await response.json();
  const quote = schema.parse(json);

  return encodeOracleContext(quote);
}
