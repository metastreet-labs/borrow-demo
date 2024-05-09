"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { sepolia } from "viem/chains";
import { WagmiProvider, http } from "wagmi";

const RPC_URL = `${process.env[`NEXT_PUBLIC_RPC_URL`]}`;

export const wagmiConfig = getDefaultConfig({
  appName: "MetaStreet Borrow Demo",
  projectId: "YOUR_PROJECT_ID",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers(props: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{props.children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
