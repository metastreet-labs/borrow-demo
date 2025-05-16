import { parseAbiParameters } from "abitype";
import { decodeAbiParameters, Hex } from "viem";

export function extractBatchQuantities(encodedBatch: Hex) {
  return decodeAbiParameters(
    parseAbiParameters(
      "address token, uint256 nonce, uint256 batchSize, uint256[] tokenIds, uint256[] quantities",
    ),
    encodedBatch,
  )[4];
}
