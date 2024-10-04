export const EPO_ABI = [
  {
    type: "function",
    inputs: [
      { name: "collateralToken", internalType: "address", type: "address" },
      { name: "currencyToken", internalType: "address", type: "address" },
      { name: "tokenIds", internalType: "uint256[]", type: "uint256[]" },
      { name: "tokenIdQuantities", internalType: "uint256[]", type: "uint256[]" },
      { name: "oracleContext", internalType: "bytes", type: "bytes" },
    ],
    name: "price",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "priceOracle",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
] as const;
