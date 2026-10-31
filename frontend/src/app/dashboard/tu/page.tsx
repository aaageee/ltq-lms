"use client";

import { UserPlus, AlertCircle, FileText, Banknote } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { formatRupiah } from "@/lib/utils";

// ── Data dummy ──
const TUNGGAKAN = [
  { nama: "Muhammad Rizky", noid: "LTQ-JKT-2026-014", program: "Tahsin", nominal: 350_000, jatuhTempo: "05 Okt 2026" },
  { nama: "Aisyah Putri", noid: "LTQ-JKT-2026-021", program: "Tartil", nominal: 300_000, jatuhTempo: "05 Okt 2026" },
  { nama: "Abdurrahman Hakim", noid: "LTQ-JKT-2026-008", program: "Talaqqi", nominal: 500_000, jatuhTempo: "05 Okt 2026" },
  { nama: "Fatimah Az-Zahra", noid: "LTQ-JKT-2026-033", program: "Tahsin", nominal: 350_000, jatuhTempo: "10 Okt 2026" },
  { nama: "Yusuf Al-Amin", noid: "LTQ-JKT-2026-045", program: "Tartil", nominal: 300_000, jatuhTempo: "10 Okt 2026" },
];

const PESERTA_BARU = [
  { nama: "Khadijah Nur", program: "Tahsin", tanggal: "28 Okt 2026" },
  { nama: "Ibrahim Sulaiman", program: "Tartil", tanggal: "29 Okt 2026" },
  { nama: "Ruqayyah Hanin", program: "Tahsin", tanggal: "31 Okt 2026" },
];

export default function TuDashboardPage() {
  const loading = useSimulatedLoad();

  return (
    <RoleDashboard role="TU">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard TU</h1>
          <p className="text-sm text-slate-500">PSB, SPP, dan layanan peserta.</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={UserPlus} label="Peserta Baru Bulan Ini" value="12" loading={loading} />
          <KpiCard icon={AlertCircle} label="Tunggakan SPP" value="8 peserta" loading={loading} accent="red" />
          <KpiCard icon={FileText} label="Formulir Masuk" value="3" loading={loading} accent="amber" />
          <KpiCard
            icon={Banknote}
            label="Total Penerimaan Hari Ini"
            value={formatRupiah(2_400_000)}
            loading={loading}
            accent="secondary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Tunggakan terbaru */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tunggakan Terbaru</CardTitle>
              <CardDescription>Peserta yang belum membayar SPP.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peserta</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TUNGGAKAN.map((t) => (
                      <TableRow key={t.noid}>
                        <TableCell>
                          <p className="font-medium text-slate-800">{t.nama}</p>
                          <p className="text-xs text-slate-400">{t.noid}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="danger">{t.jatuhTempo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(t.nominal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Peserta baru minggu ini */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peserta Baru Minggu Ini</CardTitle>
              <CardDescription>Formulir PSB yang baru terdaftar.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={3} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PESERTA_BARU.map((p) => (
                      <TableRow key={p.nama}>
                        <TableCell className="font-medium text-slate-800">{p.nama}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.program}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{p.tanggal}</TableCell>
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
