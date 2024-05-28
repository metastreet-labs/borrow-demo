import { Address } from "viem";
import { base, sepolia } from "viem/chains";

export const WATCHES_POOL_ADDRESS: Record<number, Address> = {
  [base.id]: "0xc285fb2090f80c1c405baabe9602d69d75517539",
  [sepolia.id]: "0x12267752c6efcef788374165766f21d0baf41d3c",
};
