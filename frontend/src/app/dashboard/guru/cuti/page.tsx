"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plane, Send } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useCutiList, useAjukanCuti, useGuruLain } from "@/lib/queries";

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export default function CutiPage() {
  const { data, isLoading } = useCutiList();
  const { data: guruLain } = useGuruLain();
  const ajukanCuti = useAjukanCuti();

  const [form, setForm] = useState({ start: "", end: "", reason: "", badalTeacherId: "" });
  const leaves = data?.leaves ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    ajukanCuti.mutate(
      {
        start: form.start,
        end: form.end,
        reason: form.reason.trim() || undefined,
        badalTeacherId: form.badalTeacherId ? Number(form.badalTeacherId) : null,
      },
      { onSuccess: () => setForm({ start: "", end: "", reason: "", badalTeacherId: "" }) }
    );
  }

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-5">
        <Link href="/dashboard/guru" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke dashboard
        </Link>

        <div>
          <h1 className="text-lg font-bold text-slate-800">Pengajuan Cuti</h1>
          <p className="text-sm text-slate-500">Ajukan cuti dan tunjuk guru badal pengganti.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form Pengajuan</CardTitle>
            <CardDescription>Status awal: menunggu persetujuan admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="cuti-start">Tanggal Mulai *</Label>
                  <Input id="cuti-start" type="date" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="cuti-end">Tanggal Selesai *</Label>
                  <Input id="cuti-end" type="date" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="cuti-badal">Guru Badal</Label>
                  <Select id="cuti-badal" value={form.badalTeacherId} onChange={(e) => setForm((f) => ({ ...f, badalTeacherId: e.target.value }))}>
                    <option value="">— Tanpa badal —</option>
                    {(guruLain?.teachers ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="cuti-reason">Alasan</Label>
                <Input id="cuti-reason" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="contoh: Keperluan keluarga" />
              </div>
              <Button type="submit" disabled={ajukanCuti.isPending || !form.start || !form.end}>
                <Send size={15} /> {ajukanCuti.isPending ? "Mengirim…" : "Ajukan Cuti"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={3} />
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Plane size={28} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada pengajuan cuti.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Badal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-slate-700">
                        {fmtDate(l.dateStart)} – {fmtDate(l.dateEnd)}
                      </TableCell>
                      <TableCell className="text-slate-600">{l.reason ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{l.badalTeacher?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "approved" ? "success" : l.status === "rejected" ? "danger" : "warning"}>
                          {l.status === "approved" ? "Disetujui" : l.status === "rejected" ? "Ditolak" : "Menunggu"}
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
