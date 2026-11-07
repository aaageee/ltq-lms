"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Info } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useKelasSiswa, useGuruLain, useSimpanSesi } from "@/lib/queries";
import { useQueryParam } from "@/hooks/useQueryParam";
import { cn } from "@/lib/utils";

const STATUSES = [
  { key: "hadir", label: "Hadir" },
  { key: "absen", label: "Absen" },
  { key: "izin", label: "Izin" },
  { key: "sakit", label: "Sakit" },
] as const;

type StatusKey = (typeof STATUSES)[number]["key"];

export default function PresensiPage() {
  const classParam = useQueryParam("class");
  // tunggu param terbaca dulu, lalu mount konten dengan classId yang sudah pasti
  if (classParam === null) {
    return (
      <RoleDashboard role="GURU">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </RoleDashboard>
    );
  }
  const id = Number(classParam);
  if (!Number.isFinite(id) || id <= 0) {
    return (
      <RoleDashboard role="GURU">
        <p className="py-10 text-center text-sm text-slate-500">Kelas tidak valid. Pilih kelas dari dashboard.</p>
      </RoleDashboard>
    );
  }
  return <PresensiContent classId={id} />;
}

function PresensiContent({ classId }: { classId: number }) {
  const { data, isLoading } = useKelasSiswa(classId);
  const { data: guruLain } = useGuruLain();
  const simpanSesi = useSimpanSesi();

  const [statuses, setStatuses] = useState<Record<number, StatusKey>>({});
  const [scores, setScores] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [teacherStatus, setTeacherStatus] = useState<"hadir" | "badal">("hadir");
  const [badalId, setBadalId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const students = data?.students ?? [];
  const filled = data?.sessionFilled ?? false;

  function statusOf(id: number): StatusKey {
    return statuses[id] ?? "hadir";
  }

  async function submit() {
    if (!classId) return;
    const payload = students.map((s) => {
      const scoreRaw = scores[s.id];
      return {
        studentId: s.id,
        status: statusOf(s.id),
        score: scoreRaw !== undefined && scoreRaw !== "" ? Number(scoreRaw) : null,
        notes: notes[s.id]?.trim() || null,
      };
    });

    try {
      await simpanSesi.mutateAsync({
        classId,
        teacherStatus,
        badalTeacherId: teacherStatus === "badal" && badalId ? Number(badalId) : null,
        siswaPresensi: payload,
      });
      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
    }
  }

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-5">
        <Link href="/dashboard/guru" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Presensi & Nilai {data ? `— ${data.class.name}` : ""}
            </h1>
            <p className="text-sm text-slate-500">
              {data ? `${data.class.program} • ${data.class.scheduleDays}, ${data.class.scheduleTime}` : "Memuat kelas…"}
            </p>
          </div>
          <Badge variant="default">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
          </Badge>
        </div>

        {filled && (
          <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary-light px-4 py-3 text-sm text-secondary-dark">
            <Info size={16} /> Presensi hari ini sudah diisi. Data tidak bisa diubah dari halaman ini.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Pengajar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={teacherStatus === "hadir" ? "default" : "outline"}
                size="sm"
                disabled={filled}
                onClick={() => setTeacherStatus("hadir")}
              >
                Hadir
              </Button>
              <Button
                type="button"
                variant={teacherStatus === "badal" ? "default" : "outline"}
                size="sm"
                disabled={filled}
                onClick={() => setTeacherStatus("badal")}
              >
                Badal
              </Button>
            </div>
            {teacherStatus === "badal" && (
              <div className="w-full sm:w-64">
                <Label htmlFor="badal">Guru Badal</Label>
                <Select id="badal" value={badalId} onChange={(e) => setBadalId(e.target.value)} disabled={filled}>
                  <option value="">— Pilih guru badal —</option>
                  {(guruLain?.teachers ?? []).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Siswa ({students.length})</CardTitle>
            <CardDescription>Default semua siswa hadir — ubah yang tidak hadir. Nilai di bawah 60 wajib catatan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : students.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Belum ada siswa aktif di kelas ini.</p>
            ) : (
              students.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{s.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{s.noid}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          disabled={filled}
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st.key }))}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            statusOf(s.id) === st.key
                              ? st.key === "hadir"
                                ? "bg-secondary text-white"
                                : st.key === "izin"
                                  ? "bg-amber-500 text-white"
                                  : "bg-red-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr]">
                    <div>
                      <Label htmlFor={`score-${s.id}`} className="text-[11px]">Nilai (0–100)</Label>
                      <Input
                        id={`score-${s.id}`}
                        type="number"
                        min={0}
                        max={100}
                        placeholder="—"
                        disabled={filled}
                        value={scores[s.id] ?? ""}
                        onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`notes-${s.id}`} className="text-[11px]">Catatan</Label>
                      <Input
                        id={`notes-${s.id}`}
                        placeholder="Catatan singkat (wajib jika nilai < 60)"
                        disabled={filled}
                        value={notes[s.id] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="default"
            disabled={filled || simpanSesi.isPending || students.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            <Save size={16} />
            {simpanSesi.isPending ? "Menyimpan…" : "Simpan Sesi"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={simpanSesi.isPending}
        danger={false}
        confirmLabel="Ya, simpan sesi"
        title="Simpan Sesi?"
        description={`Yakin menyimpan presensi untuk ${students.length} siswa? Presensi dan nilai akan tersimpan sekaligus.`}
      />
    </RoleDashboard>
  );
}
