import { Router, Request, Response } from "express";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { formatTanggal } from "../services/invoiceService";

const router = Router();

const reportSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive(),
  period: z.string().trim().regex(/^\d{4}-S[12]$/, 'Format periode: YYYY-Sn (contoh 2026-S1)'),
  finalScore: z.coerce.number().min(0).max(100),
  teacherNotes: z.string().trim().max(1000).optional().nullable(),
  levelRecommendation: z.string().trim().max(100).optional().nullable(),
});

// POST /api/report-cards → input raport (guru pengajar kelas)
router.post(
  "/",
  verifyToken,
  requireRole(["GURU"]),
  asyncHandler(async (req: Request, res: Response) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.sub } });
    if (!teacher || !teacher.isActive) {
      res.status(403).json({ message: "Profil guru tidak ditemukan." });
      return;
    }

    const parsed = reportSchema.safeParse({
      studentId: req.body?.studentId ?? req.body?.student_id,
      classId: req.body?.classId ?? req.body?.class_id,
      period: req.body?.period,
      finalScore: req.body?.finalScore ?? req.body?.final_score,
      teacherNotes: req.body?.teacherNotes ?? req.body?.teacher_notes ?? null,
      levelRecommendation: req.body?.levelRecommendation ?? req.body?.level_recommendation ?? null,
    });
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const cls = await prisma.class.findFirst({ where: { id: d.classId, teacherId: teacher.id } });
    if (!cls) {
      res.status(403).json({ message: "Anda bukan guru pengajar kelas ini." });
      return;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: d.studentId, classId: d.classId, status: "active" },
    });
    if (!enrollment) {
      res.status(400).json({ message: "Peserta tidak terdaftar aktif di kelas ini." });
      return;
    }

    const existing = await prisma.reportCard.findFirst({
      where: { studentId: d.studentId, classId: d.classId, period: d.period },
    });
    if (existing) {
      res.status(409).json({ message: `Raport peserta untuk periode ${d.period} sudah ada.` });
      return;
    }

    const report = await prisma.reportCard.create({
      data: {
        studentId: d.studentId,
        classId: d.classId,
        period: d.period,
        finalScore: d.finalScore,
        teacherNotes: d.teacherNotes ?? null,
        levelRecommendation: d.levelRecommendation ?? null,
        issuedAt: new Date(),
      },
    });

    res.status(201).json({ report, message: "Raport berhasil disimpan." });
  })
);

// GET /api/report-cards?classId=&period= → raport per kelas/periode (guru & TU)
router.get(
  "/",
  verifyToken,
  requireRole(["GURU", "TU", "ADMIN_CABANG"]),
  asyncHandler(async (req: Request, res: Response) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const period = String(req.query.period ?? "").trim();

    const reports = await prisma.reportCard.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(period ? { period } : {}),
      },
      include: { class: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reports });
  })
);

// GET /api/report-cards/student/:studentId → list raport peserta
router.get(
  "/student/:studentId",
  verifyToken,
  requireRole(["GURU", "TU", "ADMIN_CABANG"]),
  asyncHandler(async (req: Request, res: Response) => {
    const studentId = Number(req.params.studentId);
    if (Number.isNaN(studentId)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const reports = await prisma.reportCard.findMany({
      where: { studentId },
      include: {
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
      },
      orderBy: { period: "desc" },
    });

    res.json({ reports });
  })
);

// GET /api/report-cards/:id/pdf → raport PDF
router.get(
  "/:id/pdf",
  verifyToken,
  requireRole(["GURU", "TU", "ADMIN_CABANG"]),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const report = await prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: { select: { noid: true, name: true } },
        class: {
          select: {
            name: true,
            teacher: { select: { name: true } },
            program: { select: { name: true } },
            branch: { select: { name: true, address: true, phone: true } },
          },
        },
      },
    });
    if (!report) {
      res.status(404).json({ message: "Raport tidak ditemukan." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="raport-${report.student.noid}-${report.period}.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const left = 48;
    const right = doc.page.width - 48;

    doc.font("Helvetica-Bold").fontSize(15).text(report.class.branch?.name ?? "LTQ Markaz AlQuran", left, 48);
    doc.font("Helvetica").fontSize(9).fillColor("#555555");
    if (report.class.branch?.address) doc.text(report.class.branch.address);
    if (report.class.branch?.phone) doc.text(`Telp: ${report.class.branch.phone}`);
    doc.fillColor("#000000");

    doc.moveDown(0.6);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#1B6CA8").lineWidth(1.2).stroke();
    doc.moveDown(0.8);

    doc.font("Helvetica-Bold").fontSize(13).text("RAPORT PESERTA", { align: "center" });
    doc.font("Helvetica").fontSize(9).text(`Periode ${report.period}`, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(10);
    doc.text(`Nama Peserta : ${report.student.name}`);
    doc.text(`No. ID       : ${report.student.noid}`);
    doc.text(`Program      : ${report.class.program.name}`);
    doc.text(`Kelas        : ${report.class.name}`);
    doc.text(`Guru Pengajar: ${report.class.teacher?.name ?? "-"}`);
    doc.moveDown(1);

    // tabel nilai
    const tableTop = doc.y;
    doc.rect(left, tableTop, right - left, 20).fill("#E8F2F9");
    doc.fillColor("#1B6CA8").font("Helvetica-Bold").fontSize(10);
    doc.text("KOMPONEN", left + 8, tableTop + 6);
    doc.text("NILAI", right - 80, tableTop + 6, { width: 72, align: "right" });
    doc.fillColor("#000000");

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(10);
    doc.text("Nilai Akhir Periode", left + 8, y + 6);
    doc.text(String(report.finalScore ?? "-"), right - 80, y + 6, { width: 72, align: "right" });
    y += 22;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
    doc.moveDown(1.2);

    doc.font("Helvetica-Bold").fontSize(10).text("Catatan Guru");
    doc.font("Helvetica").fontSize(9).text(report.teacherNotes || "-", { width: right - left });
    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(10).text("Rekomendasi Level");
    doc.font("Helvetica").fontSize(9).text(report.levelRecommendation || "-");
    doc.moveDown(2);

    const signY = doc.y;
    doc.fontSize(9).text(`Diterbitkan: ${formatTanggal(report.issuedAt ?? new Date())}`, left);
    doc.text("Guru Pengajar,", right - 160, signY, { width: 160, align: "center" });
    doc.text(`( ${report.class.teacher?.name ?? "-"} )`, right - 160, signY + 46, { width: 160, align: "center" });

    doc.pipe(res);
    doc.end();
  })
);

export default router;
