"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  PlayCircle,
  CheckCircle2,
  CalendarX2,
} from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useJadwalHariIni, useKelasGuru } from "@/lib/queries";

export default function JadwalPage() {
  const { data: hariIni, isLoading: loadingHariIni } = useJadwalHariIni();
  const { data: semuaKelas, isLoading: loadingSemua } = useKelasGuru();

  const kelasHariIni = hariIni?.kelas ?? [];
  const kelasMingguan = semuaKelas?.classes ?? [];

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Jadwal Mengajar</h1>
            <p className="text-sm text-slate-500">Jadwal hari ini dan seluruh kelas yang Anda ajar.</p>
          </div>
          <Badge variant="default" className="gap-1 px-3 py-1.5">
            <CalendarDays size={14} />
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
          </Badge>
        </div>

        {/* ── Hari ini ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kelas Hari Ini {hariIni ? `(${hariIni.hari})` : ""}</CardTitle>
            <CardDescription>Kelas yang terjadwal untuk Anda ajar hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHariIni ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : kelasHariIni.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CalendarX2 size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Tidak ada kelas terjadwal hari ini.</p>
                <p className="text-xs text-slate-400">Lihat jadwal mingguan di bawah untuk hari lainnya.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {kelasHariIni.map((k) => (
                  <div
                    key={k.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                      <span className="text-sm font-bold leading-none">
                        {k.scheduleTime.split("-")[0].split(":")[0]}
                      </span>
                      <span className="text-[10px] leading-none opacity-80">
                        :{k.scheduleTime.split("-")[0].split(":")[1] ?? "00"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{k.name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {k.scheduleTime}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} /> {k.room ?? "-"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} /> {k.students} siswa
                        </span>
                      </div>
                      <Badge variant="secondary" className="mt-1.5">{k.program}</Badge>
                    </div>

                    {k.hasSession ? (
                      <Badge variant="success" className="gap-1 self-start sm:self-center">
                        <CheckCircle2 size={12} /> Sesi Selesai
                      </Badge>
                    ) : (
                      <Link
                        href={`/dashboard/guru/presensi?class=${k.id}`}
                        className="inline-flex items-center gap-1 self-start rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark sm:self-center"
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

        {/* ── Jadwal mingguan ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semua Kelas Saya</CardTitle>
            <CardDescription>Jadwal rutin mingguan seluruh kelas yang Anda ajar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSemua ? (
              <SkeletonTable rows={4} />
            ) : kelasMingguan.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada kelas yang ditugaskan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-right">Siswa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasMingguan.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium text-slate-800">{k.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{k.program}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{k.scheduleDays}</TableCell>
                      <TableCell className="text-slate-600">{k.scheduleTime}</TableCell>
                      <TableCell className="text-slate-600">{k.room ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{k.students}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleDashboard>
  );
}
