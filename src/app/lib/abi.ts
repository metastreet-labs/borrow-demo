export const POOL_ABI = [
  {
    type: "function",
    inputs: [
      { name: "collateralToken", internalType: "address", type: "address" },
      { name: "currencyToken", internalType: "address", type: "address" },
      { name: "tokenIds", internalType: "uint256[]", type: "uint256[]" },
      {
        name: "tokenIdQuantities",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "oracleContext", internalType: "bytes", type: "bytes" },
    ],
    name: "price",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "principal", internalType: "uint256", type: "uint256" },
      { name: "duration", internalType: "uint64", type: "uint64" },
      { name: "collateralToken", internalType: "address", type: "address" },
      { name: "collateralTokenId", internalType: "uint256", type: "uint256" },
      { name: "maxRepayment", internalType: "uint256", type: "uint256" },
      { name: "ticks", internalType: "uint128[]", type: "uint128[]" },
      { name: "options", internalType: "bytes", type: "bytes" },
    ],
    name: "borrow",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;
