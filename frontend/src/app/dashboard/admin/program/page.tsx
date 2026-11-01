"use client";

import { useState } from "react";
import { Plus, Pencil, PowerOff, Power, BookOpen } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { usePrograms, useCreateProgram, useUpdateProgram, useDeactivateProgram } from "@/lib/queries";
import type { Program } from "@/lib/types-m2";

export default function ProgramPage() {
  const { data, isLoading } = usePrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deactivateProgram = useDeactivateProgram();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [name, setName] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Program | null>(null);

  const programs = data?.programs ?? [];

  function openCreate() {
    setEditing(null);
    setName("");
    setFormOpen(true);
  }

  function openEdit(p: Program) {
    setEditing(p);
    setName(p.name);
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateProgram.mutate(
        { id: editing.id, body: { name } },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createProgram.mutate({ name }, { onSuccess: () => setFormOpen(false) });
    }
  }

  return (
    <RoleDashboard role="ADMIN_CABANG">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Program</h1>
            <p className="text-sm text-slate-500">Kelola program belajar di cabang ini.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Program
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={4} />
            ) : programs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <BookOpen size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada program. Tambahkan program pertama.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Program</TableHead>
                    <TableHead>Jumlah Kelas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                      <TableCell className="text-slate-600">{p._count?.classes ?? 0} kelas</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "success" : "secondary"}>
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          {p.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmTarget(p)}
                            >
                              <PowerOff size={14} /> Nonaktifkan
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-secondary-dark hover:bg-secondary-light"
                              onClick={() => updateProgram.mutate({ id: p.id, body: { isActive: true } })}
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

      {/* Form tambah/edit */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Program" : "Tambah Program"}
        description={editing ? `Mengubah program "${editing.name}".` : "Program baru untuk cabang ini."}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={submit}
              disabled={createProgram.isPending || updateProgram.isPending || name.trim().length < 2}
            >
              {createProgram.isPending || updateProgram.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="program-name">Nama Program</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Tahsin"
              required
              minLength={2}
            />
          </div>
        </form>
      </Dialog>

      {/* Konfirmasi nonaktifkan */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deactivateProgram.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
        loading={deactivateProgram.isPending}
        title="Nonaktifkan Program?"
        description={`Program "${confirmTarget?.name ?? ""}" akan dinonaktifkan. Data lama tetap tersimpan dan program bisa diaktifkan kembali.`}
      />
    </RoleDashboard>
  );
}
