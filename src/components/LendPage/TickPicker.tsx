import { fromInput, fromUnits, toUnits } from "@/lib/shared/utils";
import { Deposit } from "@/lib/subgraph/getDeposits";
import { useEffect, useMemo, useState } from "react";
import { getClosestValidLimit } from "./tick/getClosestValidLimit";
import { decodeTick, encodeTick, TickLimitType } from "./tick/tickCodec";
import { printDuration, printLimit, printRate } from "./utils";

export type PickedTick = {
  tick: bigint;
  isLimitInvalid: boolean;
};

type Props = {
  pool: Deposit["pool"];
  selectedTick: PickedTick;
  onTickSelected: (tick: PickedTick) => void;
};

export function TickPicker(props: Props) {
  const {
    pool: {
      ticks,
      durations,
      rates,
      currencyToken: { symbol },
    },
    selectedTick,
    onTickSelected,
  } = props;

  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0);
  const [selectedRateIdx, setSelectedRateIdx] = useState(0);
  const [selectedLimitType, setSelectedLimitType] = useState(TickLimitType.Absolute);
  const [_selectedLimit, _setSelectedLimit] = useState("");

  const { selectedLimit, isLimitInvalid } = useMemo(() => {
    let selectedLimit;
    // if absolute, convert to fixed point decimal
    if (selectedLimitType == TickLimitType.Absolute)
      selectedLimit = toUnits(fromInput(_selectedLimit));
    // if ratio, convert to basis points
    else selectedLimit = BigInt(fromInput(_selectedLimit).mul(100).toString());

    const closestValidLimit = getClosestValidLimit({
      limit: selectedLimit,
      limitType: selectedLimitType,
      ticks: ticks.map((t) => t.raw),
    });

    return { selectedLimit, isLimitInvalid: !_selectedLimit || closestValidLimit != selectedLimit };
  }, [_selectedLimit, selectedLimitType, ticks]);

  useEffect(() => {
    const selectedTick = encodeTick({
      limit: selectedLimit,
      limitType: selectedLimitType,
      durationIndex: selectedDurationIdx,
      rateIndex: selectedRateIdx,
    });
    onTickSelected({ tick: selectedTick, isLimitInvalid });
  }, [
    selectedLimit,
    selectedLimitType,
    selectedDurationIdx,
    selectedRateIdx,
    isLimitInvalid,
    onTickSelected,
  ]);

  return (
    <div className="flex gap-8">
      <div className="flex flex-col">
        <span className="font-semibold">Select duration</span>
        <div className="flex flex-wrap w-64 gap-1">
          {durations.map((duration, idx) => {
            return (
              <button
                key={idx}
                onClick={() => setSelectedDurationIdx(idx)}
                className={`p-1 border ${selectedDurationIdx == idx ? "bg-blue-500" : ""}`}
              >
                {printDuration(duration)}
              </button>
            );
          })}
        </div>

        <span className="font-semibold mt-4">Select rate</span>
        <div className="flex flex-wrap w-64 gap-1">
          {rates.map((rate, idx) => {
            return (
              <button
                key={idx}
                onClick={() => setSelectedRateIdx(idx)}
                className={`p-1 border ${selectedRateIdx == idx ? "bg-blue-500" : ""}`}
              >
                {printRate(rate)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 mb-2">
          <span className="font-semibold">Enter Loan Limit</span>

          <button
            className={`p-1 border ${selectedLimitType == TickLimitType.Absolute ? "bg-blue-500" : ""}`}
            onClick={() => setSelectedLimitType(TickLimitType.Absolute)}
          >
            Absolute
          </button>

          <button
            className={`p-1 border ${selectedLimitType == TickLimitType.Ratio ? "bg-blue-500" : ""}`}
            onClick={() => setSelectedLimitType(TickLimitType.Ratio)}
          >
            Ratio
          </button>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-36"
            value={_selectedLimit}
            onChange={(e) => _setSelectedLimit(e.target.value)}
          />
          <span>{selectedLimitType == TickLimitType.Absolute ? symbol : "% LTV"}</span>
        </div>
        {isLimitInvalid && <span className="text-red-500">Invalid limit</span>}
      </div>

      <span className="font-bold">OR</span>

      <div className="flex flex-col">
        <span className="font-semibold">Select existing tick</span>

        <div className="flex flex-col gap-2">
          {ticks.map((tick, idx) => {
            const { limit, limitType, rateIndex, durationIndex } = decodeTick(tick.raw);

            const isSelected = selectedTick.tick == tick.raw;

            return (
              <button
                key={idx}
                className={`p-1 border ${isSelected ? "bg-blue-500" : ""}`}
                onClick={() => {
                  setSelectedDurationIdx(durationIndex);
                  setSelectedRateIdx(rateIndex);
                  setSelectedLimitType(limitType);

                  const limitStr =
                    limitType == TickLimitType.Absolute
                      ? fromUnits(limit).toString()
                      : `${Number(limit) / 100}`;
                  _setSelectedLimit(limitStr);
                }}
              >
                {printLimit(limit, limitType, symbol)}, {printRate(rates[rateIndex])},{" "}
                {printDuration(durations[durationIndex])}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
