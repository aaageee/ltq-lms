import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Plane,
  Receipt,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@/lib/types";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Sidebar per role (sesuai spesifikasi M1-B)
export const MENUS: Record<Role, MenuItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard },
    { label: "Cabang", href: "/dashboard/super-admin/cabang", icon: Building2 },
    { label: "Manajemen Admin", href: "/dashboard/super-admin/admin", icon: ShieldCheck },
  ],
  ADMIN_CABANG: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Program", href: "/dashboard/admin/program", icon: BookOpen },
    { label: "Kelas", href: "/dashboard/admin/kelas", icon: CalendarDays },
    { label: "Guru", href: "/dashboard/admin/guru", icon: Users },
    { label: "Konfigurasi", href: "/dashboard/admin/konfigurasi", icon: Settings2 },
  ],
  GURU: [
    { label: "Dashboard", href: "/dashboard/guru", icon: LayoutDashboard },
    { label: "Jadwal Hari Ini", href: "/dashboard/guru/jadwal", icon: CalendarDays },
    { label: "Presensi & Nilai", href: "/dashboard/guru/presensi", icon: ClipboardCheck },
    { label: "Raport", href: "/dashboard/guru/raport", icon: FileText },
    { label: "Pengajuan Cuti", href: "/dashboard/guru/cuti", icon: Plane },
  ],
  TU: [
    { label: "Dashboard", href: "/dashboard/tu", icon: LayoutDashboard },
    { label: "Data Peserta", href: "/dashboard/tu/peserta", icon: Users },
    { label: "SPP & Kwitansi", href: "/dashboard/tu/spp", icon: Receipt },
    { label: "Daftar Ulang", href: "/dashboard/tu/daftar-ulang", icon: RefreshCw },
  ],
  BENDAHARA: [
    { label: "Dashboard", href: "/dashboard/bendahara", icon: LayoutDashboard },
    { label: "Kas Masuk", href: "/dashboard/bendahara/kas-masuk", icon: ArrowDownToLine },
    { label: "Kas Keluar", href: "/dashboard/bendahara/kas-keluar", icon: ArrowUpFromLine },
    { label: "Penggajian", href: "/dashboard/bendahara/penggajian", icon: Banknote },
  ],
};
