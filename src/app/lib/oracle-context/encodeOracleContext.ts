import type { Address, Hex } from "viem";
import { encodeAbiParameters, parseAbiParameters } from "viem";

export interface Quote {
  token: Address;
  tokenId: string;
  currency: Address;
  price: string;
  timestamp: number;
  duration: number;
  signature: Hex;
}

export function encodeOracleContext(quote: Quote) {
  const signedQuote = [
    [
      quote.token,
      BigInt(quote.tokenId),
      quote.currency,
      BigInt(quote.price),
      BigInt(quote.timestamp),
      BigInt(quote.duration),
    ],
    quote.signature,
  ] as const;

  return encodeAbiParameters(
    parseAbiParameters("((address,uint256,address,uint256,uint64,uint64),bytes)[]"),
    [[signedQuote]],
  );
}
