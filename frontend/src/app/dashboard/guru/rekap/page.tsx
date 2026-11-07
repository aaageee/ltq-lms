"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKelasGuru, useRekapPresensi } from "@/lib/queries";
import { cn } from "@/lib/utils";

const STATUS_LETTER: Record<string, string> = {
  hadir: "H",
  absen: "A",
  izin: "I",
  sakit: "S",
};

function cellColor(status: string | undefined) {
  if (status === "hadir") return "bg-secondary-light text-secondary-dark";
  if (status === "izin") return "bg-amber-50 text-amber-700";
  if (status === "sakit") return "bg-blue-50 text-blue-700";
  if (status === "absen") return "bg-red-50 text-red-700";
  return "text-slate-300";
}

export default function RekapPresensiPage() {
  const { data: kelasData } = useKelasGuru();
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const { data, isLoading } = useRekapPresensi(classId ? Number(classId) : 0, month);
  const classes = kelasData?.classes ?? [];

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-5">
        <Link href="/dashboard/guru" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke dashboard
        </Link>

        <div>
          <h1 className="text-lg font-bold text-slate-800">Rekap Presensi</h1>
          <p className="text-sm text-slate-500">Matriks kehadiran siswa per sesi dalam satu bulan.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-72">
              <Label htmlFor="rekap-class">Kelas</Label>
              <Select id="rekap-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— Pilih kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.program}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="rekap-month">Bulan</Label>
              <Input id="rekap-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data ? `${data.class.name} — ${data.month}` : "Matriks Presensi"}
            </CardTitle>
            <CardDescription>
              {data
                ? `${data.sessionDates.length} sesi • ${data.students.length} siswa`
                : "Pilih kelas dan bulan untuk melihat rekap."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!classId ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarRange size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Pilih kelas terlebih dahulu.</p>
              </div>
            ) : isLoading ? (
              <SkeletonTable rows={5} />
            ) : !data || data.students.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada data presensi pada bulan ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-slate-50">Siswa</TableHead>
                    {data.sessionDates.map((d) => (
                      <TableHead key={d} className="text-center">{d.slice(8, 10)}/{d.slice(5, 7)}</TableHead>
                    ))}
                    <TableHead className="text-center">H</TableHead>
                    <TableHead className="text-center">A</TableHead>
                    <TableHead className="text-center">I</TableHead>
                    <TableHead className="text-center">S</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="sticky left-0 whitespace-nowrap bg-white">
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{s.noid}</p>
                      </TableCell>
                      {data.sessionDates.map((d) => (
                        <TableCell key={d} className="text-center">
                          <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold", cellColor(s.statuses[d]))}>
                            {STATUS_LETTER[s.statuses[d]] ?? "·"}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold text-secondary-dark">{s.counts.hadir}</TableCell>
                      <TableCell className="text-center font-semibold text-red-600">{s.counts.absen}</TableCell>
                      <TableCell className="text-center font-semibold text-amber-600">{s.counts.izin}</TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">{s.counts.sakit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <Badge variant="success">H = Hadir</Badge>
          <Badge variant="danger">A = Absen</Badge>
          <Badge variant="warning">I = Izin</Badge>
          <Badge variant="default">S = Sakit</Badge>
        </div>
      </div>
    </RoleDashboard>
  );
}
