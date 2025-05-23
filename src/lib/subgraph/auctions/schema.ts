import { z } from "zod";
import { zodAddress, zodHex, zodStringToBigInt, zodStringToNumber } from "../../shared/utils";

export const AUCTION_SCHEMA = z.object({
  id: zodHex,
  liquidation: z.object({
    id: zodHex,
    loan: z.object({
      loanReceipt: zodHex,
    }),
  }),
  collateralToken: z.object({
    id: zodAddress,
  }),
  currencyToken: z.object({
    id: zodAddress,
    symbol: z.string(),
    decimals: z.number(),
  }),
  collateralTokenId: zodStringToBigInt,
  highestBid: z
    .object({
      amount: zodStringToBigInt,
      bidder: zodAddress,
    })
    .nullable(),
  endTime: zodStringToNumber,
});
