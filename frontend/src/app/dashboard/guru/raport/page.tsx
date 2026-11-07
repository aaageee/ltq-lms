"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useKelasGuru, useKelasSiswa, useReportsByClass, useSaveReport } from "@/lib/queries";
import { fetchProtectedBlobUrl, isDevMode } from "@/lib/api";
import type { ReportRow } from "@/lib/queries";

const RECOMMENDATIONS = ["Naik level", "Tetap di level", "Perlu perhatian khusus"];

function ReportRowForm({
  studentId,
  studentName,
  classId,
  period,
  existing,
}: {
  studentId: number;
  studentName: string;
  classId: number;
  period: string;
  existing?: ReportRow;
}) {
  const saveReport = useSaveReport();
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState(RECOMMENDATIONS[0]);

  async function downloadPdf(id: number) {
    if (isDevMode) {
      toast.info("PDF raport hanya tersedia saat terhubung ke backend.");
      return;
    }
    try {
      const url = await fetchProtectedBlobUrl(`/report-cards/${id}/pdf`);
      window.open(url, "_blank");
    } catch {
      toast.error("Gagal mengunduh raport.");
    }
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-slate-800">{studentName}</p>
      </TableCell>
      {existing ? (
        <>
          <TableCell className="text-center font-semibold">{existing.finalScore ?? "—"}</TableCell>
          <TableCell className="text-slate-600">{existing.teacherNotes ?? "—"}</TableCell>
          <TableCell className="text-slate-600">{existing.levelRecommendation ?? "—"}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end items-center gap-2">
              <Badge variant="success">Tersimpan</Badge>
              <Button variant="outline" size="sm" onClick={() => downloadPdf(existing.id)}>
                <Download size={14} /> PDF
              </Button>
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0–100"
              className="w-24"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </TableCell>
          <TableCell>
            <Input
              placeholder="Catatan guru"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </TableCell>
          <TableCell>
            <Select value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              {RECOMMENDATIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </TableCell>
          <TableCell className="text-right">
            <Button
              size="sm"
              disabled={saveReport.isPending || score === "" || Number(score) < 0 || Number(score) > 100}
              onClick={() =>
                saveReport.mutate({
                  studentId,
                  classId,
                  period,
                  finalScore: Number(score),
                  teacherNotes: notes.trim() || null,
                  levelRecommendation: recommendation,
                })
              }
            >
              <Save size={14} /> Simpan
            </Button>
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

export default function RaportPage() {
  const { data: kelasData } = useKelasGuru();
  const [classId, setClassId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState<"S1" | "S2">("S1");

  const period = `${year}-${semester}`;
  const numericClassId = classId ? Number(classId) : 0;
  const { data: siswaData, isLoading: siswaLoading } = useKelasSiswa(numericClassId);
  const { data: reportData } = useReportsByClass(numericClassId, period);

  const classes = kelasData?.classes ?? [];
  const students = siswaData?.students ?? [];
  const reports = reportData?.reports ?? [];

  return (
    <RoleDashboard role="GURU">
      <div className="space-y-5">
        <Link href="/dashboard/guru" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft size={15} /> Kembali ke dashboard
        </Link>

        <div>
          <h1 className="text-lg font-bold text-slate-800">Raport Peserta</h1>
          <p className="text-sm text-slate-500">Input nilai akhir, catatan, dan rekomendasi level per periode.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <Label htmlFor="raport-class">Kelas</Label>
              <Select id="raport-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— Pilih kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.program}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="raport-year">Tahun</Label>
              <Input id="raport-year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="raport-semester">Semester</Label>
              <Select id="raport-semester" value={semester} onChange={(e) => setSemester(e.target.value as "S1" | "S2")}>
                <option value="S1">S1 (Ganjil)</option>
                <option value="S2">S2 (Genap)</option>
              </Select>
            </div>
            <div className="pb-2 text-sm text-slate-500">
              Periode: <span className="font-semibold text-slate-700">{period}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Siswa {siswaData ? `— ${siswaData.class.name}` : ""}</CardTitle>
            <CardDescription>Raport yang sudah tersimpan bisa diunduh sebagai PDF.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!classId ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <FileText size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Pilih kelas terlebih dahulu.</p>
              </div>
            ) : siswaLoading ? (
              <SkeletonTable rows={4} />
            ) : students.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada siswa di kelas ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead className="w-28">Nilai Akhir</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="w-48">Rekomendasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <ReportRowForm
                      key={`${s.id}-${period}-${reports.find((r) => r.studentId === s.id)?.id ?? "new"}`}
                      studentId={s.id}
                      studentName={s.name}
                      classId={numericClassId}
                      period={period}
                      existing={reports.find((r) => r.studentId === s.id)}
                    />
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
