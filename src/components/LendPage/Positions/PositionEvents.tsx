import { fromUnits, printNumber } from "@/lib/shared/utils";
import { getDepositEvents } from "@/lib/subgraph/getDepositEvents";
import { useQuery } from "@tanstack/react-query";
import { extractChain } from "viem";
import { arbitrum, mainnet, sepolia } from "viem/chains";
import { useChainId } from "wagmi";
import { useDeposit } from "./DepositProvider";

export function PositionEvents() {
  const { deposit } = useDeposit();

  const chainId = useChainId();

  const { data: eventsData, error: eventsError } = useQuery({
    queryKey: ["depositEvents", chainId, deposit.id] as const,
    queryFn: async ({ queryKey }) => {
      const [, chainId, deposit] = queryKey;

      return getDepositEvents({ chainId, deposit });
    },
  });

  let eventsNode;
  if (!eventsData) {
    if (eventsError) eventsNode = <span className="text-red-500">{eventsError.message}</span>;
    else eventsNode = <span className="text-gray-500">Loading events...</span>;
  } else {
    eventsNode = eventsData.map((event) => {
      const explorer = extractChain({ chains: [mainnet, arbitrum, sepolia], id: chainId as any })
        .blockExplorers.default.url;

      const p = (u: bigint) => printNumber(fromUnits(u));

      const symbol = deposit.pool.currencyToken.symbol;

      let child;
      if (event.deposited)
        child = (
          <span>
            Deposited: {p(event.deposited.amount)} {symbol}
          </span>
        );
      else if (event.redeemed)
        child = (
          <span>
            Redeemed: {p(event.redeemed.shares)} {symbol}
          </span>
        );
      else if (event.withdrawn) child = <span>Withdrawn: {p(event.withdrawn.amount)} Shares</span>;
      else throw new Error("Unknown event");

      return (
        <a
          key={event.transactionHash}
          href={`${explorer}/tx/${event.transactionHash}`}
          target="_blank"
          className="underline text-sm text-blue-500 hover:text-blue-700"
        >
          {child} ➶
        </a>
      );
    });
  }

  return (
    <div className="flex flex-col w-64">
      <h3 className="text-xl font-bold mb-2">Events</h3>
      {eventsNode}
    </div>
  );
}
