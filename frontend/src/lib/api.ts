// Klien API frontend.
// - NEXT_PUBLIC_DEV_MODE=true  → pakai mock in-memory (preview GitHub Pages)
// - NEXT_PUBLIC_DEV_MODE=false → hit backend Express (M1-A/M2/M3)

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (DEV_MODE) {
    if (isForm) {
      const fd = options.body as FormData;
      const field = fd.has("foto") ? "photoUrl" : "ktpUrl";
      const file = (fd.get("foto") ?? fd.get("ktp")) as File | null;
      const dataUrl = file instanceof File ? await fileToDataUrl(file) : null;
      return mockRequest<T>(method, path, { __uploadDataUrl: dataUrl, field });
    }
    return mockRequest<T>(method, path, options.body);
  }

  const token = useAuth.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: isForm
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { message?: string }).message ?? "Terjadi kesalahan.", res.status);
  }
  return data as T;
}

// Ambil file terproteksi (foto/KTP) sebagai blob URL agar bisa ditampilkan <img>
export async function fetchProtectedBlobUrl(path: string): Promise<string> {
  if (DEV_MODE) {
    // di mock, photoUrl sudah berupa data URL — tidak dipakai
    throw new Error("Mock mode: gunakan photoUrl langsung.");
  }
  const token = useAuth.getState().accessToken;
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new ApiError("File tidak dapat dimuat.", res.status);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export const isDevMode = DEV_MODE;
