"use client";

import { useState } from "react";
import { TrendingUp, Check, X } from "lucide-react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLevelRequests, useApproveLevel, useRejectLevel, type LevelRequestRow } from "@/lib/queries";

export default function AdminKenaikanLevelPage() {
  const { data, isLoading } = useLevelRequests("pending");
  const approve = useApproveLevel();
  const reject = useRejectLevel();

  const [rejectTarget, setRejectTarget] = useState<LevelRequestRow | null>(null);
  const [reason, setReason] = useState("");

  const requests = data?.requests ?? [];

  return (
    <RoleDashboard role="ADMIN_CABANG">
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Persetujuan Kenaikan Level</h1>
          <p className="text-sm text-slate-500">Tinjau pengajuan dari guru. Menyetujui akan mengirim WA #5 ke peserta.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SkeletonTable rows={4} />
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <TrendingUp size={30} className="text-slate-300" />
                <p className="text-sm text-slate-500">Tidak ada pengajuan menunggu persetujuan.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium text-slate-800">{r.student?.name ?? "-"}</p>
                        <p className="font-mono text-[11px] text-slate-400">{r.student?.noid ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">{r.class?.name ?? "-"}</p>
                        <p className="text-xs text-slate-400">{r.class?.program.name ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{r.fromLevel ?? "—"}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <Badge variant="success">{r.toLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{r.notes ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => approve.mutate(r.id)}
                            disabled={approve.isPending}
                          >
                            <Check size={14} /> Setujui
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setRejectTarget(r);
                              setReason("");
                            }}
                          >
                            <X size={14} /> Tolak
                          </Button>
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
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Tolak Pengajuan"
        description={rejectTarget ? `${rejectTarget.student?.name ?? ""} — ${rejectTarget.fromLevel ?? "—"} → ${rejectTarget.toLevel}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectTarget) return;
                reject.mutate(
                  { id: rejectTarget.id, alasan: reason.trim() || undefined },
                  { onSuccess: () => setRejectTarget(null) }
                );
              }}
              disabled={reject.isPending}
            >
              {reject.isPending ? "Memproses…" : "Tolak Pengajuan"}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="reject-reason">Alasan (opsional)</Label>
          <Input id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan" />
        </div>
      </Dialog>
    </RoleDashboard>
  );
}
