import { zeroAddress, type Address } from "viem";
import { mainnet, sepolia } from "viem/chains";

interface SimpleSignedPriceOraclePools {
  watches: Address;
  fabrica: Address[];
  diamore: Address;
}

export const SSPO_POOLS: Record<number, SimpleSignedPriceOraclePools> = {
  [mainnet.id]: {
    watches: "0x3a1a007a688af3f86e81885ee6d30932f7ad1a91",
    fabrica: [],
    diamore: zeroAddress,
  },
  [sepolia.id]: {
    watches: "0x16a82a1c8b650f44e4415074072812d079a838d3",
    fabrica: [
      "0x00e5cb8833fdacfc6a97faa0b54384ade19be61a", // All tokens
      "0x62c2940cc4ab105cfda49bdabc3b7a9741ba9c9e", // CA-Only
    ],
    diamore: "0xb7227b964e381e8fed72d5a0a12d5d59b8802cd6",
  },
};
