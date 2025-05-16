import type { Address, Hex } from "viem";
import { encodePacked, size, zeroAddress } from "viem";

export interface UncodedBorrowOptions {
  collateralWrapperContext: Hex | undefined;
  delegateCashV2Address: Address | undefined;
  oracleContext: Hex | undefined;
}

export function encodeBorrowOptions(params: UncodedBorrowOptions) {
  const { collateralWrapperContext, delegateCashV2Address, oracleContext } = params;

  const optionTypes: string[] = [];
  const optionValues: any[] = [];

  if (collateralWrapperContext && size(collateralWrapperContext)) {
    optionTypes.push("uint16", "uint16", "bytes");
    optionValues.push(1, size(collateralWrapperContext), collateralWrapperContext);
  }

  if (delegateCashV2Address && delegateCashV2Address != zeroAddress) {
    optionTypes.push("uint16", "uint16", "bytes20");
    optionValues.push(4, 20, delegateCashV2Address);
  }

  if (oracleContext && size(oracleContext)) {
    optionTypes.push("uint16", "uint16", "bytes");
    optionValues.push(5, size(oracleContext), oracleContext);
  }

  return encodePacked(optionTypes, optionValues);
}
