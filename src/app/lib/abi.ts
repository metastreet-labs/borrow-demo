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
    inputs: [],
    name: "InvalidLength",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidQuote",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSigner",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTimestamp",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "StringTooLong",
    type: "error",
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
  {
    inputs: [],
    name: "InactiveLiquidity",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientLiquidity",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientShares",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientTickSpacing",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBorrowOptions",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidCaller",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidCollateralFilterParameters",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInterestRateModelParameters",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidLoanReceipt",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidParameters",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRedemptionStatus",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTick",
    type: "error",
  },
  {
    inputs: [],
    name: "LoanNotExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "RepaymentTooHigh",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "UnsupportedCollateral",
    type: "error",
  },
  {
    inputs: [],
    name: "UnsupportedLoanDuration",
    type: "error",
  },
] as const;
