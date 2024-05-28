import { GraphQLClient } from "graphql-request";
import { base } from "viem/chains";

const SUBGRAPH_URL_BASE = `${process.env["SUBGRAPH_URL_BASE"]}`;
const SUBGRAPH_URL_SEPOLIA = `${process.env["SUBGRAPH_URL_SEPOLIA"]}`;

export const GRAPHQL_CLIENT = new GraphQLClient(SUBGRAPH_URL_BASE);

export function getGQLClient(chainId: number) {
  return new GraphQLClient(chainId == base.id ? SUBGRAPH_URL_BASE : SUBGRAPH_URL_SEPOLIA);
}
