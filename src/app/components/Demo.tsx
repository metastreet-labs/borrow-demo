import { Loans } from "./Loans";
import { Borrow } from "./borrow/Borrow";

export function Demo() {
  return (
    <div className="flex flex-col gap-8 mt-4">
      <Borrow />

      <Loans />
    </div>
  );
}
