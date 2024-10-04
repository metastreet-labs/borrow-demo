"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSearchParamsMutation() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    return {
      get: (key: string) => {
        return searchParams.get(key);
      },
      set: (key: string, value: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value == undefined) params.delete(key);
        else params.set(key, value);
        window.history.replaceState(null, "", `?${params}`);
      },
    };
  }, [searchParams]);
}
