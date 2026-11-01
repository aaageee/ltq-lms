"use client";

import { useState } from "react";
import { Plus, Pencil, PowerOff, Power, GraduationCap, MessageCircle } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeactivateTeacher,
} from "@/lib/queries";
import type { Teacher } from "@/lib/types-m2";

interface FormState {
  name: string;
  whatsapp: string;
  specialization: string;
  email: string;
}

const EMPTY_FORM: FormState = { name: "", whatsapp: "", specialization: "", email: "" };

export default function GuruPage() {
  const { data, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deactivateTeacher = useDeactivateTeacher();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmTarget, setConfirmTarget] = useState<Teacher | null>(null);

  const teachers = data?.teachers ?? [];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      name: t.name,
      whatsapp: t.whatsapp,
      specialization: t.specialization ?? "",
      email: t.email,
    });
    setFormOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      specialization: form.specialization.trim() || null,
      email: form.email.trim(),
    };
    if (editing) {
      updateTeacher.mutate({ id: editing.id, body: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createTeacher.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  }

  const formValid =
    form.name.trim().length >= 2 &&
    form.whatsapp.trim().length >= 8 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());

  return (
    <RoleDashboard role="ADMIN_CABANG">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Guru</h1>
            <p className="text-sm text-slate-500">Kelola data guru dan akun login-nya.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Guru
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={5} />
            ) : teachers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <GraduationCap size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada data guru.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Guru</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Spesialisasi</TableHead>
                    <TableHead>Kelas Diajar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.email}</p>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://wa.me/${t.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <MessageCircle size={13} />
                          {t.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-600">{t.specialization ?? "—"}</TableCell>
                      <TableCell>
                        {t.classes.length === 0 ? (
                          <span className="text-xs text-slate-400">Belum ada kelas</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {t.classes.map((c) => (
                              <Badge key={c.id} variant="secondary">{c.name}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isActive ? "success" : "secondary"}>
                          {t.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          {t.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmTarget(t)}
                            >
                              <PowerOff size={14} /> Nonaktifkan
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-secondary-dark hover:bg-secondary-light"
                              onClick={() => updateTeacher.mutate({ id: t.id, body: { isActive: true } })}
                            >
                              <Power size={14} /> Aktifkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form tambah/edit guru */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Data Guru" : "Tambah Guru"}
        description={
          editing
            ? `Mengubah data ${editing.name}.`
            : "Akun login guru dibuat otomatis dengan password awal ltq@2026."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={submit}
              disabled={!formValid || createTeacher.isPending || updateTeacher.isPending}
            >
              {createTeacher.isPending || updateTeacher.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="teacher-name">Nama Lengkap</Label>
            <Input
              id="teacher-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="contoh: Ust. Abdul Karim"
              required
              minLength={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="teacher-wa">Nomor WhatsApp</Label>
              <Input
                id="teacher-wa"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="081234567890"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Otomatis disanitasi ke format 62xx.
              </p>
            </div>
            <div>
              <Label htmlFor="teacher-spec">Spesialisasi</Label>
              <Input
                id="teacher-spec"
                value={form.specialization}
                onChange={(e) => set("specialization", e.target.value)}
                placeholder="contoh: Tahsin"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="teacher-email">Email (akun login)</Label>
            <Input
              id="teacher-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nama@ltq.id"
              required
            />
          </div>

          {!editing && (
            <p className="rounded-lg bg-primary-light px-3 py-2 text-xs text-primary">
              Password awal akun guru: <span className="font-mono font-semibold">ltq@2026</span> —
              guru wajib menggantinya saat login pertama.
            </p>
          )}
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deactivateTeacher.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
        loading={deactivateTeacher.isPending}
        title="Nonaktifkan Guru?"
        description={`${confirmTarget?.name ?? "Guru"} akan dinonaktifkan beserta akun login-nya. Kelas yang diajar menjadi tanpa guru dan perlu di-assign ulang.`}
      />
    </RoleDashboard>
  );
}
