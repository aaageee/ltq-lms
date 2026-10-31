"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, PanelLeftClose, PanelLeft, BookOpenCheck } from "lucide-react";
import { useAuth } from "@/store/auth";
import { MENUS } from "@/lib/menu";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Warna badge per role
const ROLE_BADGE: Record<Role, "default" | "success" | "warning" | "danger" | "secondary"> = {
  SUPER_ADMIN: "danger",
  ADMIN_CABANG: "default",
  GURU: "success",
  TU: "warning",
  BENDAHARA: "secondary",
};

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [collapsed, setCollapsed] = useState(false); // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile

  const menus = MENUS[role];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col">
      {/* logo */}
      <div className={cn(
        "flex h-16 items-center gap-2.5 border-b border-white/10 px-4",
        isMobile ? "" : collapsed && "justify-center px-2"
      )}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/90 text-white">
          <BookOpenCheck size={20} />
        </span>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">LTQ Markaz AlQuran</p>
            <p className="truncate text-[11px] text-white/60">Sistem Informasi LMS</p>
          </div>
        )}
      </div>

      {/* menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menus.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
                collapsed && !isMobile && "justify-center px-2"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* footer sidebar */}
      {(!collapsed || isMobile) && (
        <div className="border-t border-white/10 p-4 text-[11px] text-white/50">
          © 2026 LTQ Markaz AlQuran
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar desktop ── */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 bg-[#155683] transition-all duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Sidebar mobile (drawer) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#155683] shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* ── Konten kanan ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <button
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Ciutkan sidebar"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">LTQ Markaz AlQuran</p>
            <p className="text-[11px] text-slate-500">Cabang Jakarta</p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* notifikasi (dummy) */}
            <button
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* user + badge role */}
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 py-1.5 pl-2 pr-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {(user?.nama ?? "??").slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-800">{user?.nama ?? "-"}</p>
                <Badge variant={ROLE_BADGE[role]} className="mt-0.5 px-1.5 py-0 text-[10px]">
                  {ROLE_LABEL[role]}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </header>

        {/* isi halaman */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
