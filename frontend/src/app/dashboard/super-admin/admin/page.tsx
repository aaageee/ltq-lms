"use client";

import { useState } from "react";
import { Plus, Pencil, KeyRound, PowerOff, ShieldCheck } from "lucide-react";
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
  useAdmins,
  useBranches,
  useCreateAdmin,
  useUpdateAdmin,
  useResetAdminPassword,
  useDeactivateAdmin,
  type AdminRow,
} from "@/lib/queries";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_CABANG: "Admin Cabang",
  TU: "TU",
  BENDAHARA: "Bendahara",
};

const ROLE_BADGE: Record<string, "default" | "warning" | "secondary"> = {
  ADMIN_CABANG: "default",
  TU: "warning",
  BENDAHARA: "secondary",
};

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  branchId: string;
}

const EMPTY: FormState = { name: "", email: "", password: "", role: "ADMIN_CABANG", branchId: "" };

export default function AdminAccountsPage() {
  const { data, isLoading } = useAdmins();
  const { data: branchData } = useBranches();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const resetPassword = useResetAdminPassword();
  const deactivateAdmin = useDeactivateAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [resetTarget, setResetTarget] = useState<AdminRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<AdminRow | null>(null);

  const users = data?.users ?? [];
  const branches = (branchData?.branches ?? []).filter((b) => b.isActive);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, branchId: String(branches[0]?.id ?? "") });
    setFormOpen(true);
  }

  function openEdit(u: AdminRow) {
    setEditing(u);
    setForm({
      name: u.name ?? "",
      email: u.email,
      password: "",
      role: u.role,
      branchId: u.branchId ? String(u.branchId) : "",
    });
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateAdmin.mutate(
        {
          id: editing.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            branchId: Number(form.branchId),
          },
        },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createAdmin.mutate(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          branchId: Number(form.branchId),
        },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  }

  const validCreate =
    form.name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
    form.password.length >= 8 &&
    /\d/.test(form.password) &&
    !!form.branchId;

  const validEdit =
    form.name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
    !!form.branchId;

  return (
    <RoleDashboard role="SUPER_ADMIN">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Manajemen Akun</h1>
            <p className="text-sm text-slate-500">
              Akun Admin Cabang, TU, dan Bendahara per cabang. Akun Super Admin tidak bisa diubah di sini.
            </p>
          </div>
          <Button onClick={openCreate} disabled={branches.length === 0}>
            <Plus size={16} /> Tambah Akun
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={4} />
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ShieldCheck size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Belum ada akun staf.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-800">{u.name ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE[u.role] ?? "secondary"}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{u.branch?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "success" : "secondary"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword("");
                            }}
                          >
                            <KeyRound size={14} /> Reset
                          </Button>
                          {u.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmTarget(u)}
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

      {/* Form tambah/edit akun */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Akun" : "Tambah Akun"}
        description={editing ? `Mengubah akun ${editing.email}.` : "Buat akun staf untuk cabang tertentu."}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={submit}
              disabled={
                (editing ? !validEdit : !validCreate) ||
                createAdmin.isPending ||
                updateAdmin.isPending
              }
            >
              {createAdmin.isPending || updateAdmin.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="acc-name">Nama *</Label>
              <Input id="acc-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ust. Ahmad Fauzi" />
            </div>
            <div>
              <Label htmlFor="acc-role">Role *</Label>
              <Select id="acc-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="ADMIN_CABANG">Admin Cabang</option>
                <option value="TU">TU</option>
                <option value="BENDAHARA">Bendahara</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="acc-email">Email *</Label>
            <Input id="acc-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="nama@ltq.id" />
          </div>
          <div>
            <Label htmlFor="acc-branch">Cabang *</Label>
            <Select id="acc-branch" value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
              <option value="">— Pilih cabang —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </Select>
          </div>
          {!editing && (
            <div>
              <Label htmlFor="acc-password">Password Awal *</Label>
              <Input
                id="acc-password"
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="min 8 karakter + angka"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Minimal 8 karakter dan mengandung angka. Wajib diganti pengguna setelah login pertama.
              </p>
            </div>
          )}
        </form>
      </Dialog>

      {/* Reset password */}
      <Dialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        description={resetTarget ? `Akun ${resetTarget.email}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (!resetTarget) return;
                resetPassword.mutate(
                  { id: resetTarget.id, password: newPassword },
                  { onSuccess: () => setResetTarget(null) }
                );
              }}
              disabled={resetPassword.isPending || newPassword.length < 8 || !/\d/.test(newPassword)}
            >
              {resetPassword.isPending ? "Menyimpan…" : "Reset Password"}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="reset-pass">Password Baru *</Label>
          <Input
            id="reset-pass"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="min 8 karakter + angka"
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            deactivateAdmin.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
        loading={deactivateAdmin.isPending}
        title="Nonaktifkan Akun?"
        description={`Akun ${confirmTarget?.email ?? ""} tidak akan bisa login lagi.`}
      />
    </RoleDashboard>
  );
}
