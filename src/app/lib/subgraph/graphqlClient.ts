import { GraphQLClient } from "graphql-request";

const SUBGRAPH_URL = `${process.env["SUBGRAPH_URL"]}`;

export const GRAPHQL_CLIENT = new GraphQLClient(SUBGRAPH_URL);
