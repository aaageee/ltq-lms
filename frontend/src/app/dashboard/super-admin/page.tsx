"use client";

import { Building2, Users, GraduationCap } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";

// ── Data dummy ──
const CABANG = [
  {
    nama: "LTQ Markaz AlQuran",
    kode: "JKT",
    alamat: "Jakarta",
    peserta: 247,
    guru: 8,
    admin: "admin@ltq.id",
    status: "Aktif",
  },
];

export default function SuperAdminDashboardPage() {
  const loading = useSimulatedLoad();

  return (
    <RoleDashboard role="SUPER_ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Super Admin</h1>
          <p className="text-sm text-slate-500">Ringkasan seluruh cabang lembaga.</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard icon={Building2} label="Total Cabang" value="1" loading={loading} />
          <KpiCard icon={Users} label="Total Peserta Semua Cabang" value="247" loading={loading} accent="secondary" />
          <KpiCard icon={GraduationCap} label="Total Guru" value="8" loading={loading} accent="amber" />
        </div>

        {/* Tabel cabang aktif */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cabang Aktif</CardTitle>
            <CardDescription>Daftar cabang yang beroperasi.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={1} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Peserta</TableHead>
                    <TableHead className="text-right">Guru</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CABANG.map((c) => (
                    <TableRow key={c.kode}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{c.nama}</p>
                        <p className="text-xs text-slate-400">{c.alamat}</p>
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">{c.kode}</TableCell>
                      <TableCell className="text-slate-600">{c.admin}</TableCell>
                      <TableCell className="text-right font-medium">{c.peserta}</TableCell>
                      <TableCell className="text-right font-medium">{c.guru}</TableCell>
                      <TableCell>
                        <Badge variant="success">{c.status}</Badge>
                      </TableCell>
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
