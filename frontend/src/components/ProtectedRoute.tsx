"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { Role, ROLE_HOME } from "@/lib/types";

// Wrapper proteksi halaman: cek login + role, redirect ke /login jika belum login.
// Jika role tidak sesuai, redirect ke dashboard role-nya sendiri.
export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return; // tunggu rehydrate dari localStorage
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [hydrated, user, allowedRoles, router]);

  // selama cek auth (atau role tak sesuai), jangan render isi halaman
  if (!hydrated || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-slate-500">Memuat…</p>
      </div>
    );
  }

  return <>{children}</>;
}
