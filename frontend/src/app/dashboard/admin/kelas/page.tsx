"use client";

import { useState } from "react";
import { Plus, Pencil, PowerOff, Power, CalendarDays, UserX } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  useClasses,
  usePrograms,
  useTeachers,
  useCreateClass,
  useUpdateClass,
  useDeactivateClass,
  type ClassPayload,
} from "@/lib/queries";
import type { ClassRow } from "@/lib/types-m2";

interface FormState {
  name: string;
  programId: string;
  teacherId: string;
  capacity: string;
  scheduleDays: string;
  scheduleTime: string;
  room: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  programId: "",
  teacherId: "",
  capacity: "15",
  scheduleDays: "",
  scheduleTime: "",
  room: "",
};

export default function KelasPage() {
  const { data, isLoading } = useClasses();
  const { data: programData } = usePrograms();
  const { data: teacherData } = useTeachers();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deactivateClass = useDeactivateClass();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmTarget, setConfirmTarget] = useState<ClassRow | null>(null);

  const classes = data?.classes ?? [];
  const activePrograms = (programData?.programs ?? []).filter((p) => p.isActive);
  const activeTeachers = (teacherData?.teachers ?? []).filter((t) => t.isActive);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, programId: String(activePrograms[0]?.id ?? "") });
    setFormOpen(true);
  }

  function openEdit(c: ClassRow) {
    setEditing(c);
    setForm({
      name: c.name,
      programId: String(c.programId),
      teacherId: c.teacherId ? String(c.teacherId) : "",
      capacity: String(c.capacity),
      scheduleDays: c.scheduleDays,
      scheduleTime: c.scheduleTime,
      room: c.room ?? "",
    });
    setFormOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ClassPayload = {
      name: form.name.trim(),
      programId: Number(form.programId),
      teacherId: form.teacherId ? Number(form.teacherId) : null,
      capacity: Number(form.capacity),
      scheduleDays: form.scheduleDays.trim(),
      scheduleTime: form.scheduleTime.trim(),
      room: form.room.trim() || null,
    };
    if (editing) {
      updateClass.mutate({ id: editing.id, body: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createClass.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  }

  const formValid =
    form.name.trim().length >= 2 &&
    form.programId !== "" &&
    Number(form.capacity) >= 1 &&
    form.scheduleDays.trim() !== "" &&
    form.scheduleTime.trim() !== "";

  return (
    <RoleDashboard role="ADMIN_CABANG">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Kelas</h1>
            <p className="text-sm text-slate-500">Kelola kelas, jadwal, kuota, dan guru pengajar.</p>
          </div>
          <Button onClick={openCreate} disabled={activePrograms.length === 0}>
            <Plus size={16} /> Tambah Kelas
          </Button>
        </div>

        {activePrograms.length === 0 && !isLoading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Belum ada program aktif. Tambahkan program terlebih dahulu sebelum membuat kelas.
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={6} />
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarDays size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada kelas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Guru</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Kuota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => {
                    const full = c.filled >= c.capacity;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="whitespace-nowrap font-medium text-slate-800">{c.name}</p>
                          {c.room && <p className="text-xs text-slate-400">{c.room}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.program.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.teacher ? (
                            <span className="text-slate-700">{c.teacher.name}</span>
                          ) : (
                            <Badge variant="warning" className="gap-1">
                              <UserX size={11} /> Belum ada guru
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <p className="text-xs">{c.scheduleDays}</p>
                          <p className="text-xs text-slate-400">{c.scheduleTime}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-700">
                            {c.filled}/{c.capacity}
                          </p>
                          <Badge variant={full ? "danger" : "success"} className="mt-0.5">
                            {full ? "Penuh" : `Sisa ${c.capacity - c.filled}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.isActive ? "success" : "secondary"}>
                            {c.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                              <Pencil size={14} /> <span className="hidden xl:inline">Edit</span>
                            </Button>
                            {c.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setConfirmTarget(c)}
                              >
                                <PowerOff size={14} /> <span className="hidden xl:inline">Nonaktifkan</span>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-secondary-dark hover:bg-secondary-light"
                                onClick={() => updateClass.mutate({ id: c.id, body: { isActive: true } })}
                              >
                                <Power size={14} /> <span className="hidden xl:inline">Aktifkan</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form tambah/edit kelas */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Kelas" : "Tambah Kelas"}
        description="Kelas wajib punya guru sebelum bisa menerima peserta."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={submit}
              disabled={!formValid || createClass.isPending || updateClass.isPending}
            >
              {createClass.isPending || updateClass.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="class-name">Nama Kelas</Label>
            <Input
              id="class-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="contoh: Kelas Tahsin A"
              required
              minLength={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="class-program">Program</Label>
              <Select
                id="class-program"
                value={form.programId}
                onChange={(e) => set("programId", e.target.value)}
                required
              >
                <option value="">— Pilih program —</option>
                {activePrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="class-teacher">Guru Pengajar</Label>
              <Select
                id="class-teacher"
                value={form.teacherId}
                onChange={(e) => set("teacherId", e.target.value)}
              >
                <option value="">— Belum ditentukan —</option>
                {activeTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="class-capacity">Kuota</Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="class-days">Hari</Label>
              <Input
                id="class-days"
                value={form.scheduleDays}
                onChange={(e) => set("scheduleDays", e.target.value)}
                placeholder="Senin,Rabu"
                required
              />
            </div>
            <div>
              <Label htmlFor="class-time">Jam</Label>
              <Input
                id="class-time"
                value={form.scheduleTime}
                onChange={(e) => set("scheduleTime", e.target.value)}
                placeholder="09:00-10:00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="class-room">Ruangan (opsional)</Label>
            <Input
              id="class-room"
              value={form.room}
              onChange={(e) => set("room", e.target.value)}
              placeholder="Ruang 1"
            />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deactivateClass.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
        loading={deactivateClass.isPending}
        title="Nonaktifkan Kelas?"
        description={`Kelas "${confirmTarget?.name ?? ""}" akan dinonaktifkan dan tidak bisa menerima peserta baru.`}
      />
    </RoleDashboard>
  );
}
