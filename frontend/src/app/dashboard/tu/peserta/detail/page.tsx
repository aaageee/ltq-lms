"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  PowerOff,
  Plane,
  Phone,
  MapPin,
  User,
  CalendarDays,
  Wallet,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useStudent, useUpdateStudent, useDeactivateStudent, useCutiStudent } from "@/lib/queries";
import { fetchProtectedBlobUrl, isDevMode } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import type { StudentDetail, StudentStatus } from "@/lib/types-m3";

function StatusBadge({ status }: { status: StudentStatus }) {
  if (status === "active") return <Badge variant="success">Aktif</Badge>;
  if (status === "cuti") return <Badge variant="warning">Cuti</Badge>;
  return <Badge variant="secondary">Nonaktif</Badge>;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
}

// Foto peserta: mode API asli diambil lewat endpoint terautentikasi (blob URL)
function StudentAvatar({ student }: { student: StudentDetail }) {
  // nilai awal dihitung lazily (hindari setState sinkron di effect)
  const [src, setSrc] = useState<string | null>(() => {
    if (!student.photoUrl) return null;
    if (isDevMode || student.photoUrl.startsWith("data:")) return student.photoUrl;
    return null;
  });

  useEffect(() => {
    if (!student.photoUrl || isDevMode || student.photoUrl.startsWith("data:")) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    fetchProtectedBlobUrl(`/students/${student.id}/foto`)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        /* biarkan inisial */
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [student.id, student.photoUrl]);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-2xl font-bold text-white">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={student.name} className="h-full w-full object-cover" />
      ) : (
        student.name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

// Baca ?id= langsung dari URL (aman untuk static export — tanpa useSearchParams/Suspense)
function useIdFromQuery(): number {
  const [id, setId] = useState(-1);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("id");
    const n = Number(raw);
    // sinkronisasi sekali dari URL (external store) — aman, bukan cascading render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setId(Number.isFinite(n) && n > 0 ? n : 0);
  }, []);
  return id;
}

function DetailContent({ id }: { id: number }) {
  const { data, isLoading } = useStudent(id);
  const updateStudent = useUpdateStudent();
  const deactivateStudent = useDeactivateStudent();
  const cutiStudent = useCutiStudent();

  const [tab, setTab] = useState("bayar");
  const [editOpen, setEditOpen] = useState(false);
  const [cutiOpen, setCutiOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const student = data?.student;

  const [editForm, setEditForm] = useState({
    name: "",
    whatsapp: "",
    dob: "",
    gender: "" as "" | "L" | "P",
    address: "",
    parentName: "",
    parentPhone: "",
  });
  const [cutiForm, setCutiForm] = useState({ start: "", end: "", reason: "" });

  // isi form edit saat dialog dibuka (hindari setState di dalam effect)
  function openEdit() {
    if (!student) return;
    setEditForm({
      name: student.name,
      whatsapp: student.whatsapp,
      dob: student.dob ? student.dob.slice(0, 10) : "",
      gender: student.gender ?? "",
      address: student.address ?? "",
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
    });
    setEditOpen(true);
  }

  if (isLoading) {
    return (
      <RoleDashboard role="TU">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-72" />
          <SkeletonTable rows={5} />
        </div>
      </RoleDashboard>
    );
  }

  if (!student) {
    return (
      <RoleDashboard role="TU">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">Peserta tidak ditemukan.</p>
            <Link href="/dashboard/tu/peserta" className="mt-3 inline-block text-sm text-primary hover:underline">
              Kembali ke daftar peserta
            </Link>
          </CardContent>
        </Card>
      </RoleDashboard>
    );
  }

  const primaryEnrollment = student.enrollments.find((e) => e.status === "active") ?? student.enrollments[0];

  return (
    <RoleDashboard role="TU">
      <div className="space-y-5">
        <Link
          href="/dashboard/tu/peserta"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary"
        >
          <ArrowLeft size={15} /> Kembali ke daftar peserta
        </Link>

        {/* Kartu biodata */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <StudentAvatar key={student.photoUrl ?? "none"} student={student} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-800">{student.name}</h1>
                  <StatusBadge status={student.status} />
                </div>
                <p className="font-mono text-xs text-slate-500">{student.noid}</p>

                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-slate-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <Phone size={14} className="text-slate-400" />
                    <a href={`https://wa.me/${student.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                      {student.whatsapp}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-slate-400" />
                    Lahir: {fmtDate(student.dob)} ({student.gender === "L" ? "L" : student.gender === "P" ? "P" : "—"})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" />
                    Wali: {student.parentName ?? "—"}
                    {student.parentPhone ? ` (${student.parentPhone})` : ""}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    {student.address ?? "—"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {student.enrollments.map((e) => (
                    <span
                      key={e.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      <span className="font-medium text-slate-700">{e.program.name}</span> • {e.class.name}
                      {e.class.teacher ? ` • ${e.class.teacher.name}` : ""}
                    </span>
                  ))}
                </div>

                {student.status === "cuti" && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                    Cuti {fmtDate(student.cutiStart)} – {fmtDate(student.cutiEnd)}
                    {student.cutiReason ? ` • ${student.cutiReason}` : ""}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Pencil size={14} /> Edit Biodata
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCutiOpen(true)}>
                  <Plane size={14} /> Cuti
                </Button>
                {student.status !== "inactive" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <PowerOff size={14} /> Nonaktifkan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs
              tabs={[
                { key: "bayar", label: "Riwayat Bayar", count: student.invoices.length },
                { key: "presensi", label: "Presensi", count: student.attendances.length },
                { key: "nilai", label: "Nilai", count: student.grades.length },
              ]}
              active={tab}
              onChange={setTab}
              className="px-4 pt-2"
            />

            {tab === "bayar" && (
              student.invoices.length === 0 ? (
                <EmptyTab icon={Wallet} text="Belum ada riwayat pembayaran." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead>Komponen</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-slate-700">{inv.period}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {inv.components.map((c) => `${c.nama} (${formatRupiah(c.jumlah)})`).join(", ")}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(inv.totalAmount)}</TableCell>
                        <TableCell className="text-slate-600">{fmtDate(inv.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : "warning"}>
                            {inv.status === "paid" ? "Lunas" : inv.status === "overdue" ? "Terlambat" : "Belum bayar"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}

            {tab === "presensi" && (
              student.attendances.length === 0 ? (
                <EmptyTab icon={ClipboardCheck} text="Belum ada data presensi." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Kehadiran</TableHead>
                      <TableHead>Guru</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.attendances.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-slate-600">{fmtDate(a.sessionDate)}</TableCell>
                        <TableCell className="text-slate-700">{a.class.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.studentStatus === "hadir"
                                ? "success"
                                : a.studentStatus === "izin"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {a.studentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{a.teacherStatus}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}

            {tab === "nilai" && (
              student.grades.length === 0 ? (
                <EmptyTab icon={GraduationCap} text="Belum ada nilai." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="text-slate-600">{fmtDate(g.createdAt)}</TableCell>
                        <TableCell className="text-slate-700">{g.class.name}</TableCell>
                        <TableCell className="capitalize text-slate-600">{g.gradeType}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={g.score >= 60 ? "success" : "danger"}>{g.score}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{g.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>

        {primaryEnrollment && (
          <p className="text-xs text-slate-400">
            Jadwal kelas: {primaryEnrollment.class.scheduleDays}, {primaryEnrollment.class.scheduleTime}
          </p>
        )}
      </div>

      {/* Edit biodata */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Biodata Peserta"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button
              onClick={() =>
                updateStudent.mutate(
                  {
                    id: student.id,
                    body: {
                      name: editForm.name.trim(),
                      whatsapp: editForm.whatsapp.trim(),
                      dob: editForm.dob || null,
                      gender: editForm.gender || null,
                      address: editForm.address.trim() || null,
                      parentName: editForm.parentName.trim() || null,
                      parentPhone: editForm.parentPhone.trim() || null,
                    },
                  },
                  { onSuccess: () => setEditOpen(false) }
                )
              }
              disabled={updateStudent.isPending || editForm.name.trim().length < 2}
            >
              {updateStudent.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="e-name">Nama Lengkap</Label>
            <Input id="e-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="e-wa">No. WhatsApp</Label>
              <Input id="e-wa" value={editForm.whatsapp} onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="e-dob">Tanggal Lahir</Label>
              <Input id="e-dob" type="date" value={editForm.dob} onChange={(e) => setEditForm((f) => ({ ...f, dob: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="e-gender">Jenis Kelamin</Label>
              <Select
                id="e-gender"
                value={editForm.gender}
                onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value as "" | "L" | "P" }))}
              >
                <option value="">— Pilih —</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="e-parent">Nama Wali</Label>
              <Input id="e-parent" value={editForm.parentName} onChange={(e) => setEditForm((f) => ({ ...f, parentName: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="e-parent-phone">No. HP Wali</Label>
              <Input id="e-parent-phone" value={editForm.parentPhone} onChange={(e) => setEditForm((f) => ({ ...f, parentPhone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="e-address">Alamat</Label>
              <Input id="e-address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Cuti */}
      <Dialog
        open={cutiOpen}
        onClose={() => setCutiOpen(false)}
        title="Tandai Peserta Cuti"
        description="Peserta tidak dihitung absen selama periode cuti."
        footer={
          <>
            <Button variant="outline" onClick={() => setCutiOpen(false)}>Batal</Button>
            <Button
              onClick={() =>
                cutiStudent.mutate(
                  {
                    id: student.id,
                    body: {
                      start: cutiForm.start,
                      end: cutiForm.end,
                      reason: cutiForm.reason.trim() || undefined,
                    },
                  },
                  { onSuccess: () => setCutiOpen(false) }
                )
              }
              disabled={cutiStudent.isPending || !cutiForm.start || !cutiForm.end}
            >
              {cutiStudent.isPending ? "Menyimpan…" : "Simpan Cuti"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-start">Mulai</Label>
              <Input id="c-start" type="date" value={cutiForm.start} onChange={(e) => setCutiForm((f) => ({ ...f, start: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-end">Selesai</Label>
              <Input id="c-end" type="date" value={cutiForm.end} onChange={(e) => setCutiForm((f) => ({ ...f, end: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="c-reason">Alasan (opsional)</Label>
            <Input id="c-reason" value={cutiForm.reason} onChange={(e) => setCutiForm((f) => ({ ...f, reason: e.target.value }))} placeholder="contoh: Sakit" />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deactivateStudent.mutate(student.id, { onSuccess: () => setConfirmOpen(false) })
        }
        loading={deactivateStudent.isPending}
        title="Nonaktifkan Peserta?"
        description={`${student.name} (${student.noid}) akan dinonaktifkan dan tidak muncul sebagai peserta aktif.`}
      />
    </RoleDashboard>
  );
}

function EmptyTab({ icon: Icon, text }: { icon: typeof Wallet; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon size={28} className="text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export default function PesertaDetailPage() {
  const id = useIdFromQuery();
  if (id === -1) {
    return (
      <RoleDashboard role="TU">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <SkeletonTable rows={5} />
        </div>
      </RoleDashboard>
    );
  }
  return <DetailContent id={id} />;
}
