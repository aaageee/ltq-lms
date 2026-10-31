"use client";

import { Users, CalendarDays, GraduationCap, Wallet } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ── Data dummy ──
const KELAS_HARI_INI = [
  { nama: "Kelas Tahsin A", program: "Tahsin", guru: "Ust. Abdul Karim", jam: "09.00–10.00", jumlah: 15 },
  { nama: "Kelas Tartil B", program: "Tartil", guru: "Ust. Ibrahim", jam: "10.00–11.00", jumlah: 12 },
  { nama: "Kelas Talaqqi A", program: "Talaqqi", guru: "Ust. Hamzah", jam: "13.00–14.30", jumlah: 8 },
  { nama: "Kelas Tahsin B", program: "Tahsin", guru: "Ust. Abdul Karim", jam: "14.30–15.30", jumlah: 16 },
  { nama: "Kelas Tartil C", program: "Tartil", guru: "Ust. Ibrahim", jam: "15.30–16.30", jumlah: 11 },
];

const PESERTA_PER_PROGRAM = [
  { program: "Tahsin", jumlah: 120 },
  { program: "Tartil", jumlah: 85 },
  { program: "Talaqqi", jumlah: 42 },
];

export default function AdminDashboardPage() {
  const loading = useSimulatedLoad();

  return (
    <RoleDashboard role="ADMIN_CABANG">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Admin Cabang</h1>
          <p className="text-sm text-slate-500">Ringkasan operasional cabang hari ini.</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Users} label="Total Peserta Aktif" value="247" loading={loading} />
          <KpiCard icon={CalendarDays} label="Total Kelas" value="12" loading={loading} accent="secondary" />
          <KpiCard icon={GraduationCap} label="Guru Aktif" value="8" loading={loading} accent="amber" />
          <KpiCard
            icon={Wallet}
            label="Pendapatan Bulan Ini"
            value={formatRupiah(18_500_000)}
            loading={loading}
            accent="secondary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Tabel kelas hari ini */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kelas Aktif Hari Ini</CardTitle>
              <CardDescription>Jadwal kelas yang berlangsung hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead className="text-right">Siswa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {KELAS_HARI_INI.map((k) => (
                      <TableRow key={k.nama}>
                        <TableCell>
                          <p className="font-medium text-slate-800">{k.nama}</p>
                          <Badge variant="secondary" className="mt-0.5">{k.program}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{k.guru}</TableCell>
                        <TableCell className="text-slate-600">{k.jam}</TableCell>
                        <TableCell className="text-right font-medium">{k.jumlah}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Chart peserta per program */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peserta per Program</CardTitle>
              <CardDescription>Distribusi peserta aktif tiap program.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PESERTA_PER_PROGRAM}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="program" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="jumlah" fill="#1B6CA8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboard>
  );
}
