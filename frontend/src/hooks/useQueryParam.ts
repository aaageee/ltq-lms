"use client";

import { useEffect, useState } from "react";

// Baca query param dari URL tanpa useSearchParams (aman untuk static export).
// null = belum terbaca di client.
export function useQueryParam(name: string, fallback = ""): string | null {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(name);
    // sinkronisasi sekali dari URL (external store)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(raw ?? fallback);
  }, [name, fallback]);

  return value;
}
