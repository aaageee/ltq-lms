"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Wallet,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboard from "@/components/dashboard/RoleDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  useInvoices,
  useTunggakan,
  useStudents,
  useCreateInvoice,
  useConfirmPayment,
  useCancelInvoice,
  useSendReminder,
} from "@/lib/queries";
import { fetchProtectedBlobUrl, isDevMode } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import type { InvoiceRow } from "@/lib/types-m4";

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function paidOf(inv: InvoiceRow) {
  return inv.paidAmount ?? inv.payments.reduce((sum, p) => sum + p.amount, 0);
}

function remainingOf(inv: InvoiceRow) {
  return inv.remaining ?? Math.max(0, inv.totalAmount - paidOf(inv));
}

function StatusBadge({ inv }: { inv: InvoiceRow }) {
  if (inv.status === "paid") return <Badge variant="success">Lunas</Badge>;
  if (inv.status === "cancelled") return <Badge variant="secondary">Dibatalkan</Badge>;
  if (paidOf(inv) > 0) return <Badge variant="warning">Dicicil</Badge>;
  if (inv.status === "overdue") return <Badge variant="danger">Terlambat</Badge>;
  return <Badge variant="warning">Belum bayar</Badge>;
}

// Preview WA #3 (teks sama dengan template backend — PRD §15)
function previewReminder(inv: InvoiceRow) {
  return `Assalamualaikum *${inv.student.name}*,

📋 Reminder tagihan SPP:
💰 Nominal      : Rp ${new Intl.NumberFormat("id-ID").format(inv.totalAmount)}
📅 Jatuh tempo  : ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(inv.dueDate))}

Silakan transfer ke:
🏦 1234567890 (Bank Syariah)
   a.n LTQ Markaz AlQuran

Balas pesan ini setelah transfer untuk konfirmasi.
Terima kasih! 🙏`;
}

export default function SppPage() {
  const [tab, setTab] = useState("daftar");

  // ── Tab 1: buat invoice ──
  const [studentSearch, setStudentSearch] = useState("");
  const { data: studentData } = useStudents({ search: studentSearch });
  const [studentId, setStudentId] = useState("");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [components, setComponents] = useState<{ nama: string; jumlah: string }[]>([
    { nama: "SPP", jumlah: "300000" },
  ]);
  const createInvoice = useCreateInvoice();

  const total = useMemo(
    () => components.reduce((sum, c) => sum + (Number(c.jumlah) || 0), 0),
    [components]
  );

  // ── Tab 2: daftar invoice ──
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const { data: invoiceData, isLoading: invoiceLoading } = useInvoices({
    status: statusFilter,
    periode: periodFilter,
    search: searchFilter,
  });

  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "transfer" });
  const confirmPayment = useConfirmPayment();

  const [cancelTarget, setCancelTarget] = useState<InvoiceRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelInvoice = useCancelInvoice();

  const [reminderTarget, setReminderTarget] = useState<InvoiceRow | null>(null);
  const sendReminder = useSendReminder();

  // ── Tab 3: tunggakan ──
  const { data: tunggakanData, isLoading: tunggakanLoading } = useTunggakan();
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const invoices = invoiceData?.invoices ?? [];
  const tunggakan = tunggakanData?.tunggakan ?? [];

  function addComponent() {
    setComponents((c) => [...c, { nama: "", jumlah: "" }]);
  }
  function removeComponent(i: number) {
    setComponents((c) => c.filter((_, idx) => idx !== i));
  }
  function setComponent(i: number, key: "nama" | "jumlah", value: string) {
    setComponents((c) => c.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  }

  async function submitInvoice(e: React.FormEvent) {
    e.preventDefault();
    const payload = components
      .filter((c) => c.nama.trim() && Number(c.jumlah) > 0)
      .map((c) => ({ nama: c.nama.trim(), jumlah: Number(c.jumlah) }));

    if (!studentId || payload.length === 0) return;

    try {
      await createInvoice.mutateAsync({
        studentId: Number(studentId),
        period,
        components: payload,
      });
      setStudentId("");
      setComponents([{ nama: "SPP", jumlah: "300000" }]);
      setTab("daftar");
    } catch {
      /* toast sudah tampil */
    }
  }

  async function downloadKwitansi(inv: InvoiceRow) {
    if (isDevMode) {
      toast.info("Kwitansi PDF hanya tersedia saat terhubung ke backend.");
      return;
    }
    try {
      const url = await fetchProtectedBlobUrl(`/invoices/${inv.id}/kwitansi`);
      window.open(url, "_blank");
    } catch {
      toast.error("Gagal mengunduh kwitansi.");
    }
  }

  async function bulkReminder() {
    if (selected.length === 0) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      try {
        await sendReminder.mutateAsync(id);
        ok += 1;
      } catch {
        /* lanjut ke berikutnya */
      }
    }
    setBulkLoading(false);
    setSelected([]);
    toast.success(`Reminder terkirim untuk ${ok} peserta.`);
  }

  return (
    <RoleDashboard role="TU">
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">SPP & Kwitansi</h1>
          <p className="text-sm text-slate-500">Buat tagihan, konfirmasi pembayaran, dan kirim reminder.</p>
        </div>

        <Tabs
          tabs={[
            { key: "daftar", label: "Daftar Invoice" },
            { key: "buat", label: "Buat Invoice" },
            { key: "tunggakan", label: "Tunggakan", count: tunggakan.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ── TAB: BUAT INVOICE ── */}
        {tab === "buat" && (
          <Card>
            <CardContent className="p-5">
              <form onSubmit={submitInvoice} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="inv-student-search">Cari Peserta</Label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="inv-student-search"
                        className="pl-9"
                        placeholder="Nama atau NoID…"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="inv-student">Peserta *</Label>
                    <Select id="inv-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                      <option value="">— Pilih peserta —</option>
                      {(studentData?.students ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.noid} — {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="sm:w-52">
                  <Label htmlFor="inv-period">Periode (bulan) *</Label>
                  <Input
                    id="inv-period"
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="mb-0">Komponen Biaya</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                      <Plus size={14} /> Tambah baris
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {components.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="Nama komponen (contoh: SPP)"
                          value={c.nama}
                          onChange={(e) => setComponent(i, "nama", e.target.value)}
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Jumlah"
                          className="w-40"
                          value={c.jumlah}
                          onChange={(e) => setComponent(i, "jumlah", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => removeComponent(i)}
                          disabled={components.length === 1}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Total tagihan</span>
                  <span className="text-lg font-bold text-primary">{formatRupiah(total)}</span>
                </div>

                <Button type="submit" disabled={createInvoice.isPending || !studentId || total <= 0}>
                  <FileText size={16} />
                  {createInvoice.isPending ? "Menyimpan…" : "Buat Invoice"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── TAB: DAFTAR INVOICE ── */}
        {tab === "daftar" && (
          <>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                  <Label htmlFor="inv-search">Cari peserta</Label>
                  <Search size={16} className="absolute bottom-3 left-3 text-slate-400" />
                  <Input
                    id="inv-search"
                    className="pl-9"
                    placeholder="Nama atau NoID…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-40">
                  <Label htmlFor="inv-status">Status</Label>
                  <Select id="inv-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Semua</option>
                    <option value="unpaid">Belum bayar</option>
                    <option value="paid">Lunas</option>
                    <option value="overdue">Terlambat</option>
                    <option value="cancelled">Dibatalkan</option>
                  </Select>
                </div>
                <div className="w-full sm:w-44">
                  <Label htmlFor="inv-filter-period">Periode</Label>
                  <Input
                    id="inv-filter-period"
                    type="month"
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {invoiceLoading ? (
                  <SkeletonTable rows={6} />
                ) : invoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Wallet size={30} className="text-slate-300" />
                    <p className="text-sm text-slate-500">Belum ada invoice.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => {
                        const dueMs = new Date(inv.dueDate).getTime();
                        // eslint-disable-next-line react-hooks/purity -- indikator "jatuh tempo dekat" memang bergantung waktu
                        const daysToDue = Math.ceil((dueMs - Date.now()) / 86_400_000);
                        const rowClass =
                          inv.status === "overdue"
                            ? "bg-red-50/60"
                            : inv.status === "unpaid" && daysToDue <= 3 && daysToDue >= 0
                              ? "bg-amber-50/60"
                              : "";
                        return (
                          <TableRow key={inv.id} className={rowClass}>
                            <TableCell>
                              <p className="font-medium text-slate-800">{inv.student.name}</p>
                              <p className="font-mono text-[11px] text-slate-400">{inv.student.noid}</p>
                            </TableCell>
                            <TableCell className="text-slate-600">{inv.period}</TableCell>
                            <TableCell className="text-right">
                              <p className="font-medium">{formatRupiah(inv.totalAmount)}</p>
                              {paidOf(inv) > 0 && inv.status !== "paid" && (
                                <p className="text-[11px] text-slate-500">
                                  dibayar {formatRupiah(paidOf(inv))} • sisa{" "}
                                  <span className="font-semibold text-red-600">{formatRupiah(remainingOf(inv))}</span>
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">{fmtDate(inv.dueDate)}</TableCell>
                            <TableCell>
                              <StatusBadge inv={inv} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-1">
                                {(inv.status === "unpaid" || inv.status === "overdue") && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setPayTarget(inv);
                                        setPayForm({ amount: String(remainingOf(inv)), method: "transfer" });
                                      }}
                                    >
                                      <CheckCircle2 size={14} /> Bayar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setReminderTarget(inv)}>
                                      <Send size={14} /> Reminder
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() => {
                                        setCancelTarget(inv);
                                        setCancelReason("");
                                      }}
                                    >
                                      <XCircle size={14} />
                                    </Button>
                                  </>
                                )}
                                {inv.payments.length > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => downloadKwitansi(inv)}>
                                    <Download size={14} /> Kwitansi
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
          </>
        )}

        {/* ── TAB: TUNGGAKAN ── */}
        {tab === "tunggakan" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{tunggakan.length} invoice</span> belum dibayar •
                total <span className="font-semibold text-red-600">{formatRupiah(tunggakanData?.totalNominal ?? 0)}</span>
              </div>
              <Button
                variant="outline"
                onClick={bulkReminder}
                disabled={selected.length === 0 || bulkLoading}
              >
                <Send size={15} />
                {bulkLoading ? "Mengirim…" : `Kirim Reminder (${selected.length})`}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {tunggakanLoading ? (
                  <SkeletonTable rows={5} />
                ) : tunggakan.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <CheckCircle2 size={30} className="text-secondary" />
                    <p className="text-sm text-slate-500">Tidak ada tunggakan. 🎉</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead>Terlambat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tunggakan.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300"
                              checked={selected.includes(inv.id)}
                              onChange={(e) =>
                                setSelected((prev) =>
                                  e.target.checked ? [...prev, inv.id] : prev.filter((x) => x !== inv.id)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-slate-800">{inv.student.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{inv.student.noid}</p>
                          </TableCell>
                          <TableCell className="text-slate-600">{inv.period}</TableCell>
                          <TableCell className="text-right">
                            <p className="font-medium">{formatRupiah(remainingOf(inv))}</p>
                            {paidOf(inv) > 0 && (
                              <p className="text-[11px] text-slate-500">dari {formatRupiah(inv.totalAmount)}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">{fmtDate(inv.dueDate)}</TableCell>
                          <TableCell>
                            {inv.daysOverdue && inv.daysOverdue > 0 ? (
                              <Badge variant="danger">{inv.daysOverdue} hari</Badge>
                            ) : (
                              <Badge variant="warning">Belum jatuh tempo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialog konfirmasi bayar */}
      <Dialog
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Konfirmasi Pembayaran"
        description={
          payTarget
            ? `${payTarget.student.name} • ${payTarget.period} • total ${formatRupiah(payTarget.totalAmount)}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (!payTarget) return;
                confirmPayment.mutate(
                  {
                    id: payTarget.id,
                    body: { amount: Number(payForm.amount), method: payForm.method },
                  },
                  { onSuccess: () => setPayTarget(null) }
                );
              }}
              disabled={
                confirmPayment.isPending ||
                Number(payForm.amount) <= 0 ||
                (payTarget ? Number(payForm.amount) > remainingOf(payTarget) + 0.01 : false)
              }
            >
              {confirmPayment.isPending ? "Memproses…" : "Konfirmasi Lunas"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {payTarget && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total tagihan</span>
                <span className="font-medium">{formatRupiah(payTarget.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sudah dibayar</span>
                <span className="font-medium">{formatRupiah(paidOf(payTarget))}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-1">
                <span className="font-semibold text-slate-700">Sisa tagihan</span>
                <span className="font-bold text-red-600">{formatRupiah(remainingOf(payTarget))}</span>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="pay-amount">Nominal Diterima *</Label>
            <Input
              id="pay-amount"
              type="number"
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Boleh dicicil — masukkan nominal ≤ sisa tagihan. Invoice otomatis LUNAS saat sisa terpenuhi.
            </p>
          </div>
          <div>
            <Label htmlFor="pay-method">Metode</Label>
            <Select
              id="pay-method"
              value={payForm.method}
              onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
            >
              <option value="transfer">Transfer bank</option>
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
            </Select>
          </div>
        </div>
      </Dialog>

      {/* Dialog batalkan invoice */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Batalkan Invoice"
        description={cancelTarget ? `${cancelTarget.student.name} • ${cancelTarget.period}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelTarget) return;
                cancelInvoice.mutate(
                  { id: cancelTarget.id, alasan: cancelReason },
                  { onSuccess: () => setCancelTarget(null) }
                );
              }}
              disabled={cancelInvoice.isPending || cancelReason.trim().length === 0}
            >
              {cancelInvoice.isPending ? "Memproses…" : "Batalkan Invoice"}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="cancel-reason">Alasan pembatalan *</Label>
          <Input
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="contoh: Peserta pindah program"
          />
        </div>
      </Dialog>

      {/* Dialog preview reminder */}
      <Dialog
        open={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        title="Kirim Reminder WhatsApp"
        description={reminderTarget ? `Ke: ${reminderTarget.student.name} (${reminderTarget.student.whatsapp})` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setReminderTarget(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (!reminderTarget) return;
                sendReminder.mutate(reminderTarget.id, { onSuccess: () => setReminderTarget(null) });
              }}
              disabled={sendReminder.isPending}
            >
              <Send size={14} /> {sendReminder.isPending ? "Mengirim…" : "Kirim Sekarang"}
            </Button>
          </>
        }
      >
        {reminderTarget && (
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
            {previewReminder(reminderTarget)}
          </pre>
        )}
      </Dialog>
    </RoleDashboard>
  );
}
