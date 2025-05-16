import { Suspense } from "react";
import { Borrow } from "./borrow/Borrow";
import { Loans } from "./Loans";
import { WrappedTokens } from "./WrappedTokens";

export function BorrowPage() {
  return (
    <div className="flex flex-col gap-8 mt-4">
      <Suspense>
        <Borrow />
        <Loans />
        <WrappedTokens />
      </Suspense>
    </div>
  );
}
