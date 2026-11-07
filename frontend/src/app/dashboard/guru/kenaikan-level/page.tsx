"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKelasGuru, useKelasSiswa, useAjukanLevel } from "@/lib/queries";

export default function KenaikanLevelPage() {
  const { data: kelasData } = useKelasGuru();
  const [classId, setClassId] = useState("");
  const numericClassId = classId ? Number(classId) : 0;
  const { data: siswaData, isLoading } = useKelasSiswa(numericClassId);
  const ajukan = useAjukanLevel();

  const [target, setTarget] = useState<{ id: number; name: string } | null>(null);
  const [levelBaru, setLevelBaru] = useState("");
  const [catatan, setCatatan] = useState("");

  const classes = kelasData?.classes ?? [];
  const students = siswaData?.students ?? [];

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-5">
        <Link href="/dashboard/guru" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke dashboard
        </Link>

        <div>
          <h1 className="text-lg font-bold text-slate-800">Kenaikan Level</h1>
          <p className="text-sm text-slate-500">Ajukan kenaikan level peserta — perlu persetujuan admin.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="w-full sm:w-72">
              <Label htmlFor="level-class">Kelas</Label>
              <Select id="level-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— Pilih kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.program}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Siswa</CardTitle>
            <CardDescription>Pengajuan akan dikirim ke admin cabang untuk disetujui.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!classId ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <TrendingUp size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Pilih kelas terlebih dahulu.</p>
              </div>
            ) : isLoading ? (
              <SkeletonTable rows={4} />
            ) : students.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada siswa di kelas ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NoID</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{s.noid}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setTarget({ id: s.id, name: s.name });
                            setLevelBaru("");
                            setCatatan("");
                          }}
                        >
                          <TrendingUp size={14} /> Ajukan Kenaikan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        title="Ajukan Kenaikan Level"
        description={target ? `Untuk ${target.name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (!target) return;
                ajukan.mutate(
                  { studentId: target.id, body: { levelBaru, catatan: catatan.trim() || undefined } },
                  { onSuccess: () => setTarget(null) }
                );
              }}
              disabled={ajukan.isPending || levelBaru.trim().length === 0}
            >
              {ajukan.isPending ? "Mengirim…" : "Kirim Pengajuan"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="level-baru">Level Baru *</Label>
            <Input
              id="level-baru"
              value={levelBaru}
              onChange={(e) => setLevelBaru(e.target.value)}
              placeholder="contoh: Level 2"
            />
          </div>
          <div>
            <Label htmlFor="level-catatan">Catatan</Label>
            <Input
              id="level-catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Alasan / pertimbangan"
            />
          </div>
        </div>
      </Dialog>
    </RoleDashboard>
  );
}
