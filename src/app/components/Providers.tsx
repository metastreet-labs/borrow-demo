"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, createContext, useContext } from "react";
import { Address } from "viem";
import { sepolia } from "viem/chains";
import { WagmiProvider, http, useAccount } from "wagmi";

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
      <Web3Provider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{props.children}</RainbowKitProvider>
        </QueryClientProvider>
      </Web3Provider>
    </WagmiProvider>
  );
}

type Web3ContextType = { connectedWalletAddress: Address | undefined };

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
}

export function Web3Provider(props: PropsWithChildren) {
  const { address: connectedWalletAddress } = useAccount();

  const context: Web3ContextType = {
    connectedWalletAddress, // can set a custom address to impersonate,
  };

  return <Web3Context.Provider value={context} {...props} />;
}
