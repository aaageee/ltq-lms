import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ServiceError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export interface ComponentInput {
  nama: string;
  jumlah: number;
}

export function formatNominal(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatTanggal(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(d);
}

// ── Buat invoice SPP ──
export async function createInvoice(params: {
  branchId: number;
  studentId: number;
  period: string;
  components: ComponentInput[];
}) {
  const { branchId, studentId, period, components } = params;

  if (!PERIOD_REGEX.test(period)) {
    throw new ServiceError(400, 'Format periode wajib "YYYY-MM" (contoh: 2026-01).');
  }
  if (!Array.isArray(components) || components.length === 0) {
    throw new ServiceError(400, "Minimal satu komponen biaya.");
  }
  for (const c of components) {
    if (!c.nama || typeof c.jumlah !== "number" || c.jumlah < 0) {
      throw new ServiceError(400, "Komponen biaya tidak valid (nama & jumlah).");
    }
  }

  const student = await prisma.student.findFirst({ where: { id: studentId, branchId } });
  if (!student) throw new ServiceError(404, "Peserta tidak ditemukan.");

  const existing = await prisma.invoice.findFirst({ where: { studentId, period } });
  if (existing) {
    throw new ServiceError(
      409,
      `Peserta ini sudah memiliki invoice untuk periode ${period}. Konfirmasi pembayaran invoice yang ada terlebih dahulu.`
    );
  }

  const totalAmount = components.reduce((sum, c) => sum + c.jumlah, 0);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return prisma.invoice.create({
    data: {
      studentId,
      branchId,
      period,
      components: components as unknown as Prisma.InputJsonValue,
      totalAmount,
      dueDate,
      status: "unpaid",
    },
    include: { student: { select: { id: true, noid: true, name: true, whatsapp: true } } },
  });
}

// ── Konfirmasi pembayaran (tanpa parsial) ──
export async function confirmPayment(params: {
  invoiceId: number;
  branchId: number;
  userId: number;
  amount: number;
  method?: string | null;
  proofUrl?: string | null;
}) {
  const { invoiceId, branchId, userId, amount, method, proofUrl } = params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, branchId },
    include: { student: { select: { id: true, noid: true, name: true, whatsapp: true } } },
  });
  if (!invoice) throw new ServiceError(404, "Invoice tidak ditemukan.");
  if (invoice.status === "paid") throw new ServiceError(409, "Invoice ini sudah lunas.");
  if (invoice.status === "cancelled") throw new ServiceError(409, "Invoice sudah dibatalkan.");

  // ── Dukungan cicilan: hitung sisa tagihan ──
  const paidAgg = await prisma.payment.aggregate({
    where: { invoiceId: invoice.id },
    _sum: { amount: true },
  });
  const alreadyPaid = paidAgg._sum.amount ?? 0;
  const remaining = invoice.totalAmount - alreadyPaid;

  if (remaining <= 0.01) {
    throw new ServiceError(409, "Invoice ini sudah lunas.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ServiceError(400, "Nominal pembayaran wajib lebih dari 0.");
  }
  if (amount > remaining + 0.01) {
    throw new ServiceError(
      400,
      `Nominal melebihi sisa tagihan (Rp ${formatNominal(remaining)}).`,
      { totalAmount: invoice.totalAmount, alreadyPaid, remaining }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount,
        method: method ?? null,
        proofUrl: proofUrl ?? null,
        confirmedById: userId,
        confirmedAt: new Date(),
      },
    });

    const newPaid = alreadyPaid + amount;
    const fullyPaid = newPaid >= invoice.totalAmount - 0.01;

    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: fullyPaid ? "paid" : "unpaid" },
      include: { student: { select: { id: true, noid: true, name: true, whatsapp: true } } },
    });

    return {
      invoice: updated,
      payment,
      paidAmount: newPaid,
      remaining: Math.max(0, invoice.totalAmount - newPaid),
      fullyPaid,
    };
  });

  return result;
}

// ── Batalkan invoice ──
export async function cancelInvoice(params: {
  invoiceId: number;
  branchId: number;
  userId: number;
  reason: string;
}) {
  const { invoiceId, branchId, userId, reason } = params;

  if (!reason || !reason.trim()) throw new ServiceError(400, "Alasan pembatalan wajib diisi.");

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, branchId } });
  if (!invoice) throw new ServiceError(404, "Invoice tidak ditemukan.");
  if (invoice.status === "paid") {
    throw new ServiceError(409, "Invoice yang sudah lunas tidak bisa dibatalkan.");
  }
  if (invoice.status === "cancelled") throw new ServiceError(409, "Invoice sudah dibatalkan.");

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "cancelled",
      cancelReason: reason.trim(),
      cancelledById: userId,
      cancelledAt: new Date(),
    },
  });
}

// ── PDF kwitansi ──
export function buildKwitansiPdf(params: {
  invoice: {
    id: number;
    period: string;
    components: unknown;
    totalAmount: number;
    status: string;
    createdAt: Date;
    payments: { amount: number; method: string | null; confirmedAt: Date | null }[];
  };
  student: { noid: string; name: string };
  branch: { name: string; address: string | null; phone: string | null; bankAccount: string | null } | null;
}): PDFKit.PDFDocument {
  const { invoice, student, branch } = params;

  const doc = new PDFDocument({ size: "A5", margin: 36 });
  const pageWidth = doc.page.width;
  const left = 36;
  const right = pageWidth - 36;

  // Header lembaga
  doc.font("Helvetica-Bold").fontSize(14).text(branch?.name ?? "LTQ Markaz AlQuran", left, 36);
  doc.font("Helvetica").fontSize(8).fillColor("#555555");
  if (branch?.address) doc.text(branch.address);
  if (branch?.phone) doc.text(`Telp: ${branch.phone}`);
  doc.fillColor("#000000");

  doc.moveDown(0.6);
  doc
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .strokeColor("#1B6CA8")
    .lineWidth(1.2)
    .stroke();
  doc.moveDown(0.6);

  doc.font("Helvetica-Bold").fontSize(12).text("KWITANSI PEMBAYARAN", { align: "center" });
  doc.moveDown(0.6);

  // Info
  const noKwitansi = `KW-${String(invoice.id).padStart(4, "0")}/${invoice.period}`;
  doc.font("Helvetica").fontSize(9);
  doc.text(`No. Kwitansi : ${noKwitansi}`);
  doc.text(`Nama Peserta : ${student.name}`);
  doc.text(`No. ID       : ${student.noid}`);
  doc.text(`Periode      : ${invoice.period}`);
  const paid = invoice.payments[0];
  doc.text(
    `Tanggal Bayar: ${paid?.confirmedAt ? formatTanggal(paid.confirmedAt) : "-"}`
  );
  doc.moveDown(0.7);

  // Tabel komponen
  const components = Array.isArray(invoice.components)
    ? (invoice.components as { nama: string; jumlah: number }[])
    : [];

  const tableTop = doc.y;
  const colNama = left + 6;
  const colJumlah = right - 6;

  doc.font("Helvetica-Bold").fontSize(9);
  doc.rect(left, tableTop, right - left, 18).fill("#E8F2F9");
  doc.fillColor("#1B6CA8").text("KOMPONEN", colNama, tableTop + 5);
  doc.text("JUMLAH", colJumlah - 90, tableTop + 5, { width: 90, align: "right" });
  doc.fillColor("#000000");

  let y = tableTop + 18;
  doc.font("Helvetica").fontSize(9);
  for (const c of components) {
    doc.text(c.nama, colNama, y + 5);
    doc.text(`Rp ${formatNominal(c.jumlah)}`, colJumlah - 90, y + 5, { width: 90, align: "right" });
    y += 18;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .strokeColor("#E5E7EB")
      .lineWidth(0.5)
      .stroke();
  }

  // Total
  doc
    .rect(left, y, right - left, 22)
    .fill("#F4F6F9")
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("TOTAL DIBAYAR", colNama, y + 6)
    .text(`Rp ${formatNominal(invoice.totalAmount)}`, colJumlah - 110, y + 6, {
      width: 110,
      align: "right",
    });

  // Tanda tangan
  const signY = y + 60;
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`Jakarta, ${formatTanggal(new Date())}`, right - 150, signY, { width: 150, align: "center" })
    .text("Diterima oleh,", right - 150, signY + 14, { width: 150, align: "center" })
    .text("( TU Lembaga )", right - 150, signY + 52, { width: 150, align: "center" });

  doc.fontSize(7).fillColor("#777777").text(
    "Kwitansi ini sah dan dikeluarkan secara elektronik oleh sistem LMS LTQ Markaz AlQuran.",
    left,
    doc.page.height - 60,
    { width: right - left, align: "center" }
  );

  doc.end();
  return doc;
}
