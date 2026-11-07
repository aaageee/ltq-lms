"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, ChevronRight, ChevronLeft, Check, Eye } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { Dropzone } from "@/components/ui/dropzone";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import {
  useStudents,
  usePrograms,
  useClasses,
  useCreateStudent,
  useUploadStudentFile,
} from "@/lib/queries";
import type { StudentRow } from "@/lib/types-m3";

const STEPS = ["Biodata", "Program & Kelas", "Konfirmasi"];

interface FormState {
  name: string;
  whatsapp: string;
  dob: string;
  gender: "" | "L" | "P";
  address: string;
  parentName: string;
  parentPhone: string;
  programId: string;
  classId: string;
  foto: File | null;
  ktp: File | null;
}

const EMPTY_FORM: FormState = {
  name: "",
  whatsapp: "",
  dob: "",
  gender: "",
  address: "",
  parentName: "",
  parentPhone: "",
  programId: "",
  classId: "",
  foto: null,
  ktp: null,
};

function StatusBadge({ status }: { status: StudentRow["status"] }) {
  if (status === "active") return <Badge variant="success">Aktif</Badge>;
  if (status === "cuti") return <Badge variant="secondary">Cuti</Badge>;
  return <Badge variant="secondary">Nonaktif</Badge>;
}

export default function PesertaPage() {
  const [status, setStatus] = useState("");
  const [programId, setProgramId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useStudents({ status, programId, search });
  const { data: programData } = usePrograms();
  const { data: classData } = useClasses();
  const createStudent = useCreateStudent();
  const uploadFile = useUploadStudentFile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [success, setSuccess] = useState<{ noid: string; id: number; name: string } | null>(null);

  const students = data?.students ?? [];
  const programs = (programData?.programs ?? []).filter((p) => p.isActive);
  const classes = useMemo(() => {
    const all = classData?.classes ?? [];
    if (!form.programId) return [];
    return all.filter((c) => c.programId === Number(form.programId) && c.isActive);
  }, [classData, form.programId]);

  const selectedClass = classes.find((c) => c.id === Number(form.classId));
  const selectedProgram = programs.find((p) => p.id === Number(form.programId));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openDrawer() {
    setForm(EMPTY_FORM);
    setStep(0);
    setDrawerOpen(true);
  }

  const stepValid =
    step === 0
      ? form.name.trim().length >= 2 && form.whatsapp.replace(/\D/g, "").length >= 8
      : step === 1
        ? !!form.programId && !!form.classId
        : true;

  async function submit() {
    try {
      const result = await createStudent.mutateAsync({
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim(),
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        parentName: form.parentName.trim() || null,
        parentPhone: form.parentPhone.trim() || null,
        programId: Number(form.programId),
        classId: Number(form.classId),
      });

      if (form.foto) {
        await uploadFile.mutateAsync({ id: result.student.id, field: "foto", file: form.foto });
      }
      if (form.ktp) {
        await uploadFile.mutateAsync({ id: result.student.id, field: "ktp", file: form.ktp });
      }

      setDrawerOpen(false);
      setSuccess({ noid: result.noid, id: result.student.id, name: result.student.name });
    } catch {
      // error sudah ditampilkan lewat toast
    }
  }

  return (
    <RoleDashboard role="TU">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Data Peserta</h1>
            <p className="text-sm text-slate-500">PSB dan manajemen data peserta.</p>
          </div>
          <Button onClick={openDrawer}>
            <Plus size={16} /> Tambah Peserta Baru
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Label htmlFor="search-peserta">Cari</Label>
              <Search size={16} className="absolute bottom-3 left-3 text-slate-400" />
              <Input
                id="search-peserta"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nama, NoID, atau nomor WA…"
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="filter-status">Status</Label>
              <Select id="filter-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="inactive">Nonaktif</option>
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="filter-program">Program</Label>
              <Select id="filter-program" value={programId} onChange={(e) => setProgramId(e.target.value)}>
                <option value="">Semua program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabel peserta */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={6} />
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Users size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">Tidak ada peserta yang cocok dengan filter.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NoID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Program / Kelas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">{s.noid}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/tu/peserta/detail?id=${s.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://wa.me/${s.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-slate-600 hover:text-primary hover:underline"
                        >
                          {s.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">{s.program ?? "—"}</p>
                        <p className="text-xs text-slate-400">{s.kelas ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/tu/peserta/detail?id=${s.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary-light"
                        >
                          <Eye size={14} /> Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Drawer form multi-step ── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Tambah Peserta Baru"
        description={`Langkah ${step + 1} dari ${STEPS.length}: ${STEPS[step]}`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => (step === 0 ? setDrawerOpen(false) : setStep((s) => s - 1))}
              disabled={createStudent.isPending}
            >
              <ChevronLeft size={16} /> {step === 0 ? "Batal" : "Kembali"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
                Lanjut <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={submit} disabled={createStudent.isPending || uploadFile.isPending}>
                <Check size={16} />
                {createStudent.isPending || uploadFile.isPending ? "Menyimpan…" : "Simpan Peserta"}
              </Button>
            )}
          </>
        }
      >
        {/* indikator langkah */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i <= step ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span className={`hidden text-xs sm:block ${i <= step ? "text-slate-700" : "text-slate-400"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="f-name">Nama Lengkap *</Label>
              <Input
                id="f-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="contoh: Muhammad Rizky"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="f-wa">No. WhatsApp *</Label>
                <Input
                  id="f-wa"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="081234567890"
                />
                <p className="mt-1 text-[11px] text-slate-400">Otomatis disanitasi ke format 62xx.</p>
              </div>
              <div>
                <Label htmlFor="f-dob">Tanggal Lahir</Label>
                <Input id="f-dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="f-gender">Jenis Kelamin</Label>
                <Select
                  id="f-gender"
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value as FormState["gender"])}
                >
                  <option value="">— Pilih —</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-parent">Nama Wali / Orang Tua</Label>
                <Input
                  id="f-parent"
                  value={form.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                  placeholder="Nama wali"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="f-parent-phone">No. HP Wali</Label>
                <Input
                  id="f-parent-phone"
                  value={form.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                  placeholder="081298765432"
                />
              </div>
              <div>
                <Label htmlFor="f-address">Alamat</Label>
                <Input
                  id="f-address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Jl. …"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Dropzone
                label="Foto Peserta"
                accept="image/jpeg,image/png"
                hint="JPG/PNG, maks 2MB"
                file={form.foto}
                onChange={(f) => set("foto", f)}
              />
              <Dropzone
                label="KTP / Kartu Identitas"
                accept="image/jpeg,image/png,application/pdf"
                hint="JPG/PNG/PDF, maks 2MB"
                file={form.ktp}
                onChange={(f) => set("ktp", f)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="f-program">Program *</Label>
              <Select
                id="f-program"
                value={form.programId}
                onChange={(e) => {
                  set("programId", e.target.value);
                  set("classId", "");
                }}
              >
                <option value="">— Pilih program —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-class">Kelas *</Label>
              <Select
                id="f-class"
                value={form.classId}
                onChange={(e) => set("classId", e.target.value)}
                disabled={!form.programId}
              >
                <option value="">— Pilih kelas —</option>
                {classes.map((c) => {
                  const sisa = c.capacity - c.filled;
                  const penuh = sisa <= 0;
                  const tanpaGuru = !c.teacherId;
                  return (
                    <option key={c.id} value={c.id} disabled={penuh || tanpaGuru}>
                      {c.name} — {tanpaGuru ? "belum ada guru" : penuh ? "penuh" : `sisa ${sisa}`}
                    </option>
                  );
                })}
              </Select>
              {form.programId && classes.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-600">Belum ada kelas aktif untuk program ini.</p>
              )}
            </div>

            {selectedClass && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-medium text-slate-700">{selectedClass.name}</p>
                <p>Guru: {selectedClass.teacher?.name ?? "belum ada guru"}</p>
                <p>Jadwal: {selectedClass.scheduleDays}, {selectedClass.scheduleTime}</p>
                <p>
                  Kuota: {selectedClass.filled}/{selectedClass.capacity} — sisa{" "}
                  <span className="font-semibold text-secondary-dark">
                    {selectedClass.capacity - selectedClass.filled}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Biodata</p>
              <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div><dt className="text-xs text-slate-500">Nama</dt><dd className="font-medium text-slate-800">{form.name}</dd></div>
                <div><dt className="text-xs text-slate-500">WhatsApp</dt><dd className="text-slate-700">{form.whatsapp}</dd></div>
                <div><dt className="text-xs text-slate-500">Tanggal Lahir</dt><dd className="text-slate-700">{form.dob || "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Jenis Kelamin</dt><dd className="text-slate-700">{form.gender === "L" ? "Laki-laki" : form.gender === "P" ? "Perempuan" : "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Wali</dt><dd className="text-slate-700">{form.parentName || "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">HP Wali</dt><dd className="text-slate-700">{form.parentPhone || "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Alamat</dt><dd className="text-slate-700">{form.address || "—"}</dd></div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Program & Kelas</p>
              <p className="text-slate-800">{selectedProgram?.name ?? "—"}</p>
              <p className="text-slate-600">{selectedClass?.name ?? "—"}</p>
              {selectedClass && (
                <p className="text-xs text-slate-500">
                  {selectedClass.scheduleDays}, {selectedClass.scheduleTime} • sisa{" "}
                  {selectedClass.capacity - selectedClass.filled} kuota
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Berkas</p>
              <p className="text-slate-700">Foto: {form.foto?.name ?? "—"}</p>
              <p className="text-slate-700">KTP: {form.ktp?.name ?? "—"}</p>
            </div>

            <p className="rounded-lg bg-primary-light px-3 py-2 text-xs text-primary">
              Setelah disimpan, NoID peserta dibuat otomatis (format LTQ-JKT-TAHUN-NNN) dan konfirmasi
              pendaftaran dicatat untuk dikirim via WhatsApp.
            </p>
          </div>
        )}
      </Drawer>

      {/* Dialog sukses */}
      <Dialog
        open={!!success}
        onClose={() => setSuccess(null)}
        title="Peserta berhasil didaftarkan"
        footer={
          <>
            <Button variant="outline" onClick={() => setSuccess(null)}>Tutup</Button>
            {success && (
              <Link href={`/dashboard/tu/peserta/detail?id=${success.id}`}>
                <Button>Lihat Detail</Button>
              </Link>
            )}
          </>
        }
      >
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{success?.name}</span> terdaftar dengan NoID:
          </p>
          <p className="rounded-xl bg-primary-light px-4 py-3 font-mono text-lg font-bold text-primary">
            {success?.noid}
          </p>
          <p className="text-xs text-slate-500">
            Konfirmasi pendaftaran (WA #1) sudah dicatat dan akan dikirim otomatis.
          </p>
        </div>
      </Dialog>
    </RoleDashboard>
  );
}
