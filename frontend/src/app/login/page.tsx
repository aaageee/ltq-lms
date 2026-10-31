"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { ROLE_HOME, type Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Tombol shortcut login cepat (hanya tampil saat DEV_MODE=true)
const SHORTCUTS: Array<{ label: string; email: string; role: Role }> = [
  { label: "Login sebagai Super Admin", email: "superadmin@ltq.id", role: "SUPER_ADMIN" },
  { label: "Login sebagai Admin", email: "admin@ltq.id", role: "ADMIN_CABANG" },
  { label: "Login sebagai Guru", email: "guru@ltq.id", role: "GURU" },
  { label: "Login sebagai TU", email: "tu@ltq.id", role: "TU" },
  { label: "Login sebagai Bendahara", email: "bendahara@ltq.id", role: "BENDAHARA" },
];

export default function LoginPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // sudah login → langsung ke dashboard sesuai role
  useEffect(() => {
    if (user) router.replace(ROLE_HOME[user.role]);
  }, [user, router]);

  async function doLogin(e?: React.FormEvent, preset?: { email: string; role: Role }) {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const targetEmail = preset?.email ?? email;
      await login(targetEmail, password || "admin123");
      // redirect ditangani useEffect di atas (user sudah terisi store)
      if (preset) router.replace(ROLE_HOME[preset.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-background to-secondary-light p-4">
      <div className="w-full max-w-md space-y-4">
        {/* header lembaga */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <BookOpenCheck size={28} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">LTQ Markaz AlQuran</h1>
            <p className="text-sm text-slate-500">Sistem Informasi LMS</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Masuk ke akun Anda</CardTitle>
            <CardDescription>
              Gunakan email lembaga yang terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => doLogin(e)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@ltq.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                Masuk
              </Button>
            </form>

            {/* Shortcut dev — disembunyikan di production */}
            {DEV_MODE && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  ⚡ Login Cepat (Dev Mode)
                </p>
                <div className="grid gap-2">
                  {SHORTCUTS.map((s) => (
                    <Button
                      key={s.email}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      disabled={loading}
                      onClick={() => doLogin(undefined, { email: s.email, role: s.role })}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Password semua akun dev: <span className="font-mono">admin123</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
