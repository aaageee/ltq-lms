"use client";

import { Building2, Users, GraduationCap } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useBranches } from "@/lib/queries";

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useBranches();
  const branches = data?.branches ?? [];
  const active = branches.filter((b) => b.isActive);

  const totalPeserta = branches.reduce((sum, b) => sum + (b._count?.students ?? 0), 0);
  const totalGuru = branches.reduce((sum, b) => sum + (b._count?.users ?? 0), 0);

  return (
    <RoleDashboard role="SUPER_ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Super Admin</h1>
          <p className="text-sm text-slate-500">Ringkasan seluruh cabang lembaga.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard icon={Building2} label="Total Cabang Aktif" value={String(active.length)} loading={isLoading} />
          <KpiCard
            icon={Users}
            label="Total Peserta Semua Cabang"
            value={String(totalPeserta)}
            loading={isLoading}
            accent="secondary"
          />
          <KpiCard icon={GraduationCap} label="Total Guru" value={String(totalGuru)} loading={isLoading} accent="amber" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Cabang</CardTitle>
            <CardDescription>Ringkasan jumlah peserta, kelas, dan guru per cabang.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={3} />
            ) : branches.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada cabang.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Peserta</TableHead>
                    <TableHead className="text-right">Kelas</TableHead>
                    <TableHead className="text-right">Guru</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{b.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{b.code}</p>
                      </TableCell>
                      <TableCell className="text-slate-600">{b.address ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.students ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.classes ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.users ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={b.isActive ? "success" : "secondary"}>
                          {b.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
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
