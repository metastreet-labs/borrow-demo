import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Demo } from "./components/Demo";
import { Providers } from "./components/Providers";

export default function Home() {
  return (
    <Providers>
      <main className="flex flex-col p-8">
        <ConnectButton />
        <Demo />
      </main>
    </Providers>
  );
}
