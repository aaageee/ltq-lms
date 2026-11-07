import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { waKenaikanLevel, sendWABackground } from "../services/whatsapp";

// ── Router untuk guru: POST /api/students/:id/kenaikan-level ──
export const studentLevelRouter = Router();

const ajukanSchema = z.object({
  levelBaru: z.string().trim().min(1, "Level baru wajib diisi").max(50),
  catatan: z.string().trim().max(500).optional().nullable(),
});

studentLevelRouter.post(
  "/:id/kenaikan-level",
  verifyToken,
  requireRole(["GURU"]),
  asyncHandler(async (req: Request, res: Response) => {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = ajukanSchema.safeParse({
      levelBaru: req.body?.levelBaru ?? req.body?.level_baru,
      catatan: req.body?.catatan ?? req.body?.notes ?? null,
    });
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "active" },
          include: { class: { select: { id: true, name: true } }, program: { select: { name: true } } },
        },
      },
    });
    if (!student) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      res.status(400).json({ message: "Peserta belum terdaftar di kelas aktif mana pun." });
      return;
    }

    const pending = await prisma.levelUpRequest.findFirst({
      where: { studentId, status: "pending" },
    });
    if (pending) {
      res.status(409).json({ message: "Sudah ada pengajuan kenaikan level yang menunggu persetujuan." });
      return;
    }

    const request = await prisma.levelUpRequest.create({
      data: {
        studentId,
        classId: enrollment.classId,
        fromLevel: enrollment.level,
        toLevel: parsed.data.levelBaru,
        notes: parsed.data.catatan ?? null,
        status: "pending",
        requestedById: req.user!.sub,
      },
      include: {
        student: { select: { id: true, noid: true, name: true } },
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
      },
    });

    res.status(201).json({ request, message: "Pengajuan kenaikan level terkirim ke admin." });
  })
);

// ── Router admin: /api/kenaikan-level ──
const adminRouter = Router();
adminRouter.use(verifyToken, requireRole(["ADMIN_CABANG"]));

adminRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const statusRaw = String(req.query.status ?? "").trim();
    const status = ["pending", "approved", "rejected"].includes(statusRaw)
      ? (statusRaw as "pending" | "approved" | "rejected")
      : undefined;

    const requests = await prisma.levelUpRequest.findMany({
      where: { ...(status ? { status } : {}), student: { branchId: req.user!.branchId ?? undefined } },
      include: {
        student: { select: { id: true, noid: true, name: true } },
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
        requestedBy: { select: { id: true, email: true } },
        reviewedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ requests });
  })
);

adminRouter.put(
  "/:id/approve",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const request = await prisma.levelUpRequest.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, noid: true, name: true, whatsapp: true } },
        class: { select: { id: true, name: true, program: { select: { name: true } } } },
      },
    });
    if (!request) {
      res.status(404).json({ message: "Pengajuan tidak ditemukan." });
      return;
    }
    if (request.status !== "pending") {
      res.status(409).json({ message: "Pengajuan ini sudah diproses." });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const reqRow = await tx.levelUpRequest.update({
        where: { id },
        data: {
          status: "approved",
          reviewedById: req.user!.sub,
          reviewedAt: new Date(),
        },
      });

      await tx.enrollment.updateMany({
        where: { studentId: request.studentId, classId: request.classId, status: "active" },
        data: { level: request.toLevel },
      });

      return reqRow;
    });

    // WA #5 (background)
    const message = waKenaikanLevel({
      nama: request.student.name,
      level_baru: request.toLevel,
      program: request.class.program.name,
    });
    sendWABackground(request.student.whatsapp, message, "#5");

    res.json({ request: updated, message: "Kenaikan level disetujui dan WA #5 dicatat." });
  })
);

adminRouter.put(
  "/:id/reject",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const request = await prisma.levelUpRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ message: "Pengajuan tidak ditemukan." });
      return;
    }
    if (request.status !== "pending") {
      res.status(409).json({ message: "Pengajuan ini sudah diproses." });
      return;
    }

    const reason = String(req.body?.alasan ?? req.body?.reason ?? "").trim();

    const updated = await prisma.levelUpRequest.update({
      where: { id },
      data: {
        status: "rejected",
        notes: reason || request.notes,
        reviewedById: req.user!.sub,
        reviewedAt: new Date(),
      },
    });

    res.json({ request: updated, message: "Pengajuan kenaikan level ditolak." });
  })
);

export default adminRouter;
