"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "MetaStreet Borrow Demo",
  projectId: "YOUR_PROJECT_ID",
  chains: [sepolia],
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
