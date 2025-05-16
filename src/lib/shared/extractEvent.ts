import type { ExtractAbiEventNames } from "abitype";
import type { Abi, ContractEventName, DecodeEventLogReturnType, TransactionReceipt } from "viem";
import { decodeEventLog } from "viem";

interface ExtractEventParams<TAbi extends Abi, TEventName extends ExtractAbiEventNames<TAbi>> {
  receipt: TransactionReceipt;
  abi: TAbi;
  eventName: TEventName;
}

export function extractEvents<TAbi extends Abi, TEventName extends ContractEventName<TAbi>>(
  params: ExtractEventParams<TAbi, TEventName>,
) {
  const { receipt, abi, eventName } = params;

  const x: DecodeEventLogReturnType<TAbi, TEventName, `0x${string}`[], `0x${string}`, true>[] = [];

  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi,
        topics: log.topics,
        data: log.data,
        eventName: eventName,
      });
      if (event.eventName == eventName) x.push(event);
    } catch (e) {
      //
    }
  }

  return x;
}
