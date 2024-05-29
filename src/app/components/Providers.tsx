"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, createContext, useContext } from "react";
import { Address } from "viem";
import { base, sepolia } from "viem/chains";
import { WagmiProvider, http, useAccount, useChainId } from "wagmi";

const SEPOLIA_RPC_URL = `${process.env[`NEXT_PUBLIC_RPC_URL_SEPOLIA`]}`;
const BASE_RPC_URL = `${process.env[`NEXT_PUBLIC_RPC_URL_BASE`]}`;

export const wagmiConfig = getDefaultConfig({
  appName: "MetaStreet Borrow Demo",
  projectId: "YOUR_PROJECT_ID",
  chains: [base, sepolia],
  transports: {
    [base.id]: http(BASE_RPC_URL),
    [sepolia.id]: http(SEPOLIA_RPC_URL),
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

type Web3ContextType = { chainId: number; connectedWalletAddress: Address | undefined };

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
}

export function Web3Provider(props: PropsWithChildren) {
  const { address: connectedWalletAddress } = useAccount();
  const chainId = useChainId();

  const context: Web3ContextType = {
    chainId,
    connectedWalletAddress, // can set a custom address to impersonate,
  };

  return <Web3Context.Provider value={context} {...props} />;
}
