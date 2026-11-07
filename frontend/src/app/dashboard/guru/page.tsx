"use client";

import Link from "next/link";
import { CalendarClock, Users, ClipboardCheck, CalendarX2, PlayCircle, CheckCircle2 } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJadwalHariIni } from "@/lib/queries";

export default function GuruDashboardPage() {
  const { data, isLoading } = useJadwalHariIni();
  const kelas = data?.kelas ?? [];
  const totalSiswa = kelas.reduce((sum, k) => sum + k.students, 0);
  const selesai = kelas.filter((k) => k.hasSession).length;

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Guru</h1>
          <p className="text-sm text-slate-500">Jadwal, presensi, dan kelas Anda hari ini.</p>
        </div>

        {!isLoading && kelas.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <CalendarX2 size={20} className="text-amber-600" />
            <p className="text-sm text-amber-800">Belum ada sesi hari ini. Selamat beristirahat, Ustaz.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard icon={Users} label="Total Siswa (kelas hari ini)" value={`${totalSiswa} siswa`} loading={isLoading} />
          <KpiCard
            icon={ClipboardCheck}
            label="Sesi Selesai Hari Ini"
            value={`${selesai}/${kelas.length} sesi`}
            loading={isLoading}
            accent="secondary"
          />
          <KpiCard icon={CalendarClock} label="Kelas Hari Ini" value={`${kelas.length} kelas`} loading={isLoading} accent="amber" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jadwal Hari Ini {data?.hari ? `(${data.hari})` : ""}</CardTitle>
            <CardDescription>Kelas yang harus Anda ajar hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : kelas.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Tidak ada kelas terjadwal hari ini.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {kelas.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                      <span className="text-sm font-bold leading-none">{k.scheduleTime.split("-")[0].split(":")[0]}</span>
                      <span className="text-[10px] leading-none opacity-80">:00</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{k.name}</p>
                      <p className="text-xs text-slate-500">
                        {k.program} • {k.room ?? "-"} • {k.students} siswa
                      </p>
                      <p className="text-xs text-slate-400">{k.scheduleTime}</p>
                    </div>
                    {k.hasSession ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 size={12} /> Sesi Selesai
                      </Badge>
                    ) : (
                      <Link
                        href={`/dashboard/guru/presensi?class=${k.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        <PlayCircle size={14} /> Mulai Sesi
                      </Link>
                    )}
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
