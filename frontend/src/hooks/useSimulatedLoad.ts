"use client";

import { useEffect, useState } from "react";

// Simulasi jeda loading data API (M1-B: semua data dummy).
// Saat modul berikutnya pakai TanStack Query, hook ini diganti loading state query.
export function useSimulatedLoad(delayMs = 400): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return loading;
}
