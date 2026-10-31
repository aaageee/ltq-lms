"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { ROLE_HOME } from "@/lib/types";

// Halaman root: arahkan berdasarkan status login
export default function Home() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? ROLE_HOME[user.role] : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-slate-500">Memuat…</p>
    </div>
  );
}
