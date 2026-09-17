"use client";

import { useEffect, useState } from "react";

/** Re-renders on an interval so relative timestamps stay fresh. */
export function useNow(intervalMs = 10_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
