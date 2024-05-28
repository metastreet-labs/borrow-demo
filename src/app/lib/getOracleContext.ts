import { encodeAbiParameters, parseAbiParameters } from "viem";
import { base, sepolia } from "viem/chains";
import { z } from "zod";
import { zodAddress, zodHex } from "./utils";

const schema = z.object({
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
});

const WATCHES_API_URL: Record<number, string> = {
  [base.id]: "https://api.watches.io",
  [sepolia.id]: "https://api-dev.horodex.io",
};

export async function getOracleContext(chainId: number, tokenId: string) {
  const response = await fetch(
    `${WATCHES_API_URL[chainId]}/public/marketplace/physical-watch/token/quote?token_id=${tokenId}`,
  );

  const data = schema.parse(await response.json());

  const signedQuote = [
    [
      data.token,
      BigInt(data.tokenId),
      data.currency,
      BigInt(data.price),
      BigInt(data.timestamp),
      BigInt(data.duration),
    ],
    data.signature.signature,
  ] as const;

  const oracleContext = encodeAbiParameters(
    parseAbiParameters("((address,uint256,address,uint256,uint64,uint64),bytes)[]"),
    [[signedQuote]],
  );

  return oracleContext;
}
