"use client";

import { CalendarClock, Users, ClipboardCheck, CalendarX2 } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";

// ── Data dummy ──
const JADWAL_HARI_INI = [
  { kelas: "Kelas Tahsin A", jam: "09.00", ruang: "Ruang 1", jumlah: 15 },
  { kelas: "Kelas Tartil B", jam: "14.00", ruang: "Ruang 3", jumlah: 12 },
];

export default function GuruDashboardPage() {
  const loading = useSimulatedLoad();
  const adaJadwal = JADWAL_HARI_INI.length > 0;

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Guru</h1>
          <p className="text-sm text-slate-500">Jadwal, presensi, dan kelas Anda hari ini.</p>
        </div>

        {/* Banner jika tidak ada jadwal */}
        {!loading && !adaJadwal && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <CalendarX2 size={20} className="text-amber-600" />
            <p className="text-sm text-amber-800">Belum ada sesi hari ini. Selamat beristirahat, Ustaz.</p>
          </div>
        )}

        {/* Ringkasan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard icon={Users} label="Total Siswa Saya" value="18 siswa" loading={loading} />
          <KpiCard
            icon={ClipboardCheck}
            label="Presensi Bulan Ini"
            value="12/14 sesi"
            sub="2 sesi belum diisi"
            loading={loading}
            accent="secondary"
          />
          <KpiCard icon={CalendarClock} label="Sesi Hari Ini" value={`${JADWAL_HARI_INI.length} sesi`} loading={loading} accent="amber" />
        </div>

        {/* Jadwal hari ini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jadwal Hari Ini</CardTitle>
            <CardDescription>Kelas yang harus Anda ajar hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {JADWAL_HARI_INI.map((j) => (
                  <div
                    key={j.kelas}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                      <span className="text-sm font-bold leading-none">{j.jam.split(".")[0]}</span>
                      <span className="text-[10px] leading-none opacity-80">.{j.jam.split(".")[1]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{j.kelas}</p>
                      <p className="text-xs text-slate-500">
                        {j.ruang} • {j.jumlah} siswa
                      </p>
                      <Badge variant="default" className="mt-1">Mengajar</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleDashboard>
  );
}
