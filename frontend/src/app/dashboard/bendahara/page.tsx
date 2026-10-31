"use client";

import { ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { formatRupiah } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// ── Data dummy ──
const KOMPOSISI = [
  { name: "SPP", value: 70, color: "#1B6CA8" },
  { name: "Kegiatan", value: 20, color: "#2ECC71" },
  { name: "Lainnya", value: 10, color: "#94A3B8" },
];

const TRANSAKSI = [
  { tanggal: "31 Okt", keterangan: "SPP — Muhammad Rizky", jenis: "masuk", nominal: 350_000 },
  { tanggal: "31 Okt", keterangan: "SPP — Aisyah Putri", jenis: "masuk", nominal: 300_000 },
  { tanggal: "30 Okt", keterangan: "Listrik & internet kelas", jenis: "keluar", nominal: 450_000 },
  { tanggal: "30 Okt", keterangan: "SPP — Abdurrahman Hakim", jenis: "masuk", nominal: 500_000 },
  { tanggal: "29 Okt", keterangan: "Perlengkapan alat tulis", jenis: "keluar", nominal: 220_000 },
];

export default function BendaharaDashboardPage() {
  const loading = useSimulatedLoad();

  return (
    <RoleDashboard role="BENDAHARA">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Bendahara</h1>
          <p className="text-sm text-slate-500">Kas, penggajian, dan laporan keuangan.</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={ArrowDownToLine}
            label="Total Pemasukan Bulan Ini"
            value={formatRupiah(22_500_000)}
            loading={loading}
            accent="secondary"
          />
          <KpiCard
            icon={ArrowUpFromLine}
            label="Total Pengeluaran"
            value={formatRupiah(14_200_000)}
            loading={loading}
            accent="red"
          />
          <KpiCard icon={Wallet} label="Saldo" value={formatRupiah(8_300_000)} loading={loading} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Donut komposisi pemasukan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Komposisi Pemasukan</CardTitle>
              <CardDescription>Proporsi pemasukan per kategori bulan ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={KOMPOSISI}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {KOMPOSISI.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaksi terakhir */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
              <CardDescription>5 transaksi kas terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TRANSAKSI.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-slate-500">{t.tanggal}</TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800">{t.keterangan}</p>
                          <Badge variant={t.jenis === "masuk" ? "success" : "danger"} className="mt-0.5">
                            {t.jenis === "masuk" ? "Masuk" : "Keluar"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            t.jenis === "masuk" ? "text-secondary-dark" : "text-red-600"
                          }`}
                        >
                          {t.jenis === "masuk" ? "+" : "−"}
                          {formatRupiah(t.nominal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleDashboard>
  );
}
