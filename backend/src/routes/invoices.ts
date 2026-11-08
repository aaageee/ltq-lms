import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createInvoice,
  confirmPayment,
  cancelInvoice,
  buildKwitansiPdf,
  ServiceError,
  formatNominal,
  formatTanggal,
} from "../services/invoiceService";
import { waKonfirmasiBayar, waReminderTagihan, sendWABackground } from "../services/whatsapp";

const router = Router();

// SPP & kwitansi: TU dan BENDAHARA
router.use(verifyToken, requireRole(["TU", "BENDAHARA"]));

function branchIdOf(req: Request): number | null {
  return req.user?.branchId ?? null;
}

// GET /api/invoices?status=&periode=&search=
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun belum terhubung ke cabang." });
      return;
    }

    const statusRaw = String(req.query.status ?? "").trim();
    const status = ["unpaid", "paid", "overdue", "cancelled"].includes(statusRaw)
      ? (statusRaw as "unpaid" | "paid" | "overdue" | "cancelled")
      : undefined;
    const periode = String(req.query.periode ?? "").trim();
    const search = String(req.query.search ?? "").trim();

    const invoices = await prisma.invoice.findMany({
      where: {
        branchId,
        ...(status ? { status } : {}),
        ...(periode ? { period: periode } : {}),
        ...(search
          ? {
              student: {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { noid: { contains: search, mode: "insensitive" as const } },
                ],
              },
            }
          : {}),
      },
      include: {
        student: { select: { id: true, noid: true, name: true, whatsapp: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json({ invoices });
  })
);

// GET /api/invoices/tunggakan → invoice unpaid/overdue
router.get(
  "/tunggakan",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun belum terhubung ke cabang." });
      return;
    }

    const invoices = await prisma.invoice.findMany({
      where: { branchId, status: { in: ["unpaid", "overdue"] } },
      include: {
        student: { select: { id: true, noid: true, name: true, whatsapp: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const now = Date.now();
    const data = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...inv,
        paidAmount,
        remaining: Math.max(0, inv.totalAmount - paidAmount),
        daysOverdue: Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86_400_000)),
      };
    });

    res.json({
      tunggakan: data,
      totalNominal: data.reduce((sum, i) => sum + i.remaining, 0),
      jumlah: data.length,
    });
  })
);

const createSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  period: z.string().trim(),
  components: z
    .array(z.object({ nama: z.string().trim().min(1), jumlah: z.coerce.number().nonnegative() }))
    .min(1),
});

// POST /api/invoices
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun belum terhubung ke cabang." });
      return;
    }

    const body = {
      studentId: req.body?.studentId ?? req.body?.student_id,
      period: req.body?.period ?? req.body?.periode,
      components: req.body?.components,
    };
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const invoice = await createInvoice({ branchId, ...parsed.data });
      res.status(201).json({ invoice, message: "Invoice berhasil dibuat." });
    } catch (err) {
      if (err instanceof ServiceError) {
        res.status(err.status).json({ message: err.message, ...(err.extra ?? {}) });
        return;
      }
      throw err;
    }
  })
);

const bayarSchema = z.object({
  amount: z.coerce.number().positive("Nominal wajib diisi"),
  method: z.string().trim().max(50).optional().nullable(),
  proofUrl: z.string().trim().max(255).optional().nullable(),
});

// PUT /api/invoices/:id/konfirmasi-bayar
router.put(
  "/:id/konfirmasi-bayar",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = bayarSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const { invoice, payment, paidAmount, remaining, fullyPaid } = await confirmPayment({
        invoiceId: id,
        branchId,
        userId: req.user!.sub,
        amount: parsed.data.amount,
        method: parsed.data.method ?? null,
        proofUrl: parsed.data.proofUrl ?? null,
      });

      // WA #2 (background, tidak memblokir response)
      const message = waKonfirmasiBayar({
        nama: invoice.student.name,
        periode: invoice.period,
        nominal: formatNominal(payment.amount),
      });
      sendWABackground(invoice.student.whatsapp, message, "#2");

      res.json({
        invoice,
        payment,
        paidAmount,
        remaining,
        fullyPaid,
        message: fullyPaid
          ? "Pembayaran berhasil dikonfirmasi — tagihan LUNAS."
          : `Cicilan diterima. Sisa tagihan: Rp ${formatNominal(remaining)}.`,
      });
    } catch (err) {
      if (err instanceof ServiceError) {
        res.status(err.status).json({ message: err.message, ...(err.extra ?? {}) });
        return;
      }
      throw err;
    }
  })
);

// PUT /api/invoices/:id/batalkan
router.put(
  "/:id/batalkan",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const alasan = String(req.body?.alasan ?? req.body?.reason ?? "").trim();
    if (!alasan) {
      res.status(400).json({ message: "Alasan pembatalan wajib diisi." });
      return;
    }

    try {
      const invoice = await cancelInvoice({
        invoiceId: id,
        branchId,
        userId: req.user!.sub,
        reason: alasan,
      });
      res.json({ invoice, message: "Invoice dibatalkan." });
    } catch (err) {
      if (err instanceof ServiceError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// GET /api/invoices/:id/kwitansi → PDF
router.get(
  "/:id/kwitansi",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, branchId },
      include: {
        student: { select: { noid: true, name: true } },
        payments: { orderBy: { createdAt: "desc" } },
        branch: { select: { name: true, address: true, phone: true, bankAccount: true } },
      },
    });
    if (!invoice) {
      res.status(404).json({ message: "Invoice tidak ditemukan." });
      return;
    }
    if (invoice.payments.length === 0) {
      res.status(409).json({ message: "Kwitansi belum tersedia — belum ada pembayaran." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="kwitansi-${invoice.student.noid}-${invoice.period}.pdf"`
    );

    const doc = buildKwitansiPdf({
      invoice: {
        id: invoice.id,
        period: invoice.period,
        components: invoice.components,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        payments: invoice.payments,
      },
      student: invoice.student,
      branch: invoice.branch,
    });
    doc.pipe(res);
  })
);

// POST /api/invoices/:id/kirim-reminder → WA #3
router.post(
  "/:id/kirim-reminder",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, branchId },
      include: {
        student: { select: { name: true, whatsapp: true } },
        branch: { select: { name: true, bankAccount: true } },
      },
    });
    if (!invoice) {
      res.status(404).json({ message: "Invoice tidak ditemukan." });
      return;
    }
    if (invoice.status === "paid") {
      res.status(409).json({ message: "Invoice sudah lunas, tidak perlu reminder." });
      return;
    }
    if (invoice.status === "cancelled") {
      res.status(409).json({ message: "Invoice sudah dibatalkan." });
      return;
    }

    const message = waReminderTagihan({
      nama: invoice.student.name,
      nominal: formatNominal(invoice.totalAmount),
      jatuh_tempo: formatTanggal(invoice.dueDate),
      rekening_bank: invoice.branch?.bankAccount ?? "-",
      nama_lembaga: invoice.branch?.name ?? "LTQ Markaz AlQuran",
    });

    sendWABackground(invoice.student.whatsapp, message, "#3");

    res.json({
      message: "Reminder tagihan dicatat dan sedang dikirim via WhatsApp.",
      preview: message,
    });
  })
);

export default router;
