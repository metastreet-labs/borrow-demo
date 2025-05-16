import { Address, zeroAddress } from "viem";
import { arbitrum, sepolia } from "viem/chains";

type CollateralWrappers = {
  bundle: Address;
  erc1155: Address;
};

export const COLLATERAL_WRAPPERS: Record<number, CollateralWrappers> = {
  [sepolia.id]: {
    bundle: "0x83c7bc92bcFF43b9F682B7C2eE897A7130a36543",
    erc1155: "0x5ea2fEfE67992D9e9e65FaF1B566731081d46a73",
  },
  [arbitrum.id]: {
    bundle: "0xC2356bf42c8910fD6c28Ee6C843bc0E476ee5D26",
    erc1155: zeroAddress,
  },
};
