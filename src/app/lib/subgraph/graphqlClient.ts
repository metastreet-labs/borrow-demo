import { GraphQLClient } from "graphql-request";
import { mainnet, sepolia } from "viem/chains";

const URLS: Record<number, string> = {
  [mainnet.id]: `${process.env["SUBGRAPH_URL_MAINNET"]}`,
  [sepolia.id]: `${process.env["SUBGRAPH_URL_SEPOLIA"]}`,
};

export function getGQLClient(chainId: number) {
  return new GraphQLClient(URLS[chainId]);
}
