"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, Role } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Data dummy untuk mode preview (NEXT_PUBLIC_DEV_MODE=true)
const DUMMY_PASSWORD = "admin123";
const DUMMY_USERS: Array<AuthUser & { password: string }> = [
  { id: 1, email: "superadmin@ltq.id", role: "SUPER_ADMIN" as Role, branchId: null, nama: "Ust. Abu Bakar", password: DUMMY_PASSWORD },
  { id: 2, email: "admin@ltq.id", role: "ADMIN_CABANG" as Role, branchId: 1, nama: "Ust. Ahmad Fauzi", password: DUMMY_PASSWORD },
  { id: 3, email: "guru@ltq.id", role: "GURU" as Role, branchId: 1, nama: "Ust. Abdul Karim", password: DUMMY_PASSWORD },
  { id: 4, email: "tu@ltq.id", role: "TU" as Role, branchId: 1, nama: "Ustazah Maryam", password: DUMMY_PASSWORD },
  { id: 5, email: "bendahara@ltq.id", role: "BENDAHARA" as Role, branchId: 1, nama: "Ust. Rahman Hakim", password: DUMMY_PASSWORD },
];

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      login: async (email, password) => {
        if (DEV_MODE) {
          // Mode dummy: tidak hit API, cocokkan dengan data hardcoded
          const found = DUMMY_USERS.find(
            (u) => u.email === email && u.password === password
          );
          if (!found) {
            throw new Error("Email atau password salah");
          }
          const user: AuthUser = {
            id: found.id,
            email: found.email,
            role: found.role,
            branchId: found.branchId,
            nama: found.nama,
          };
          set({ user, accessToken: `dummy-token-${user.role}` });
          return;
        }

        // Mode nyata: hit backend
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // untuk refresh cookie httpOnly
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message ?? "Login gagal. Coba lagi.");
        }
        set({
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            branchId: data.user.branchId,
            nama: data.user.email.split("@")[0],
          },
          accessToken: data.accessToken,
        });
      },

      logout: async () => {
        if (!DEV_MODE) {
          try {
            await fetch(`${API_URL}/auth/logout`, {
              method: "POST",
              credentials: "include",
            });
          } catch {
            // abaikan — cookie akan dihapus server saat expired
          }
        }
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: "ltq-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
