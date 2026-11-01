// Klien API frontend.
// - NEXT_PUBLIC_DEV_MODE=true  → pakai mock in-memory (preview GitHub Pages)
// - NEXT_PUBLIC_DEV_MODE=false → hit backend Express (M1-A/M2)

import { useAuth } from "@/store/auth";
import { mockRequest } from "./mock-db";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  if (DEV_MODE) {
    return mockRequest<T>(method, path, options.body);
  }

  const token = useAuth.getState().accessToken;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { message?: string }).message ?? "Terjadi kesalahan.", res.status);
  }
  return data as T;
}
