"use client";

import { useState } from "react";
import { Plus, Pencil, PowerOff, Building2 } from "lucide-react";
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
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeactivateBranch,
  type BranchRow,
} from "@/lib/queries";

interface FormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  bankAccount: string;
}

const EMPTY: FormState = { name: "", code: "", address: "", phone: "", bankAccount: "" };

export default function CabangPage() {
  const { data, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deactivateBranch = useDeactivateBranch();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmTarget, setConfirmTarget] = useState<BranchRow | null>(null);

  const branches = data?.branches ?? [];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  }

  function openEdit(b: BranchRow) {
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code,
      address: b.address ?? "",
      phone: b.phone ?? "",
      bankAccount: b.bankAccount ?? "",
    });
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      bankAccount: form.bankAccount.trim() || null,
    };
    if (editing) {
      updateBranch.mutate({ id: editing.id, body: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createBranch.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  }

  const valid = form.name.trim().length >= 2 && form.code.trim().length >= 2;

  return (
    <RoleDashboard role="SUPER_ADMIN">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Cabang</h1>
            <p className="text-sm text-slate-500">Kelola cabang lembaga. Cabang aktif terakhir tidak bisa dinonaktifkan.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Cabang
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={3} />
            ) : branches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Building2 size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada cabang.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Rekening</TableHead>
                    <TableHead className="text-right">Peserta</TableHead>
                    <TableHead className="text-right">Kelas</TableHead>
                    <TableHead className="text-right">Guru</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{b.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{b.code}</p>
                      </TableCell>
                      <TableCell className="text-slate-600">{b.address ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{b.bankAccount ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.students ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.classes ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">{b._count?.users ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={b.isActive ? "success" : "secondary"}>
                          {b.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          {b.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmTarget(b)}
                            >
                              <PowerOff size={14} /> Nonaktifkan
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

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Cabang" : "Tambah Cabang"}
        description={editing ? `Mengubah ${editing.name}.` : "Cabang baru untuk lembaga."}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={submit} disabled={!valid || createBranch.isPending || updateBranch.isPending}>
              {createBranch.isPending || updateBranch.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="branch-name">Nama Cabang *</Label>
              <Input id="branch-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="LTQ Markaz AlQuran Surabaya" />
            </div>
            <div>
              <Label htmlFor="branch-code">Kode *</Label>
              <Input id="branch-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SBY" maxLength={10} />
            </div>
          </div>
          <div>
            <Label htmlFor="branch-address">Alamat</Label>
            <Input id="branch-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="branch-phone">No. HP</Label>
              <Input id="branch-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="branch-bank">Rekening Bank</Label>
              <Input id="branch-bank" value={form.bankAccount} onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))} placeholder="1234567890 (BSI)" />
            </div>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deactivateBranch.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
        loading={deactivateBranch.isPending}
        title="Nonaktifkan Cabang?"
        description={`${confirmTarget?.name ?? "Cabang"} akan dinonaktifkan. Data lama tetap tersimpan.`}
      />
    </RoleDashboard>
  );
}
