import { Navigation } from "@/components/shared/Navigation";
import { Providers } from "@/components/shared/Providers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PropsWithChildren } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaStreet Demo",
  description: "Reference implementation for MetaStreet V2",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="flex flex-col p-8">
            <ConnectButton />
            <Navigation />
            {props.children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
