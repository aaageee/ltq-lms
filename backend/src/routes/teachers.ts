import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { sanitizeWhatsapp, isValidWhatsapp } from "../utils/whatsapp";

const router = Router();

router.use(verifyToken, requireRole(["ADMIN_CABANG"]));

// Password default guru (NFR: min 8 karakter + angka) — wajib diganti saat login pertama
const DEFAULT_TEACHER_PASSWORD = "ltq@2026";

const teacherCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama guru minimal 2 karakter").max(100),
  whatsapp: z.string().trim().min(8, "Nomor WhatsApp wajib diisi"),
  specialization: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().email("Email tidak valid"),
});

const teacherUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  whatsapp: z.string().trim().min(8).optional(),
  specialization: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().email("Email tidak valid").optional(),
  isActive: z.boolean().optional(),
});

function branchIdOf(req: Request): number | null {
  return req.user?.branchId ?? null;
}

// GET /api/teachers → list guru aktif + kelas yang diajar
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const teachers = await prisma.teacher.findMany({
      where: { user: { branchId }, deletedAt: null },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        user: { select: { email: true, isActive: true } },
        classes: { select: { id: true, name: true }, where: { isActive: true } },
      },
    });

    const data = teachers.map((t) => ({
      id: t.id,
      name: t.name,
      whatsapp: t.whatsapp,
      specialization: t.specialization,
      email: t.user.email,
      isActive: t.isActive && t.user.isActive,
      classes: t.classes,
    }));

    res.json({ teachers: data });
  })
);

// POST /api/teachers → tambah guru + otomatis buat akun login (role GURU)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const parsed = teacherCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const whatsapp = sanitizeWhatsapp(d.whatsapp);
    if (!isValidWhatsapp(whatsapp)) {
      res.status(400).json({ message: "Nomor WhatsApp tidak valid (contoh: 081234567890)." });
      return;
    }

    const emailTaken = await prisma.user.findUnique({ where: { email: d.email } });
    if (emailTaken) {
      res.status(409).json({ message: "Email sudah digunakan akun lain." });
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 12);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: d.email, passwordHash, role: "GURU", branchId },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          name: d.name,
          whatsapp,
          specialization: d.specialization ?? null,
        },
        include: { user: { select: { email: true } } },
      });
    });

    res.status(201).json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        whatsapp: teacher.whatsapp,
        specialization: teacher.specialization,
        email: teacher.user.email,
        isActive: teacher.isActive,
        classes: [],
      },
      message: `Guru ditambahkan. Password awal: ${DEFAULT_TEACHER_PASSWORD} (wajib diganti saat login pertama).`,
    });
  })
);

// PUT /api/teachers/:id → edit data guru
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = teacherUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const existing = await prisma.teacher.findFirst({
      where: { id, user: { branchId }, deletedAt: null },
      include: { user: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Guru tidak ditemukan." });
      return;
    }

    let whatsapp: string | undefined;
    if (d.whatsapp !== undefined) {
      whatsapp = sanitizeWhatsapp(d.whatsapp);
      if (!isValidWhatsapp(whatsapp)) {
        res.status(400).json({ message: "Nomor WhatsApp tidak valid (contoh: 081234567890)." });
        return;
      }
    }

    if (d.email && d.email !== existing.user.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: d.email } });
      if (emailTaken) {
        res.status(409).json({ message: "Email sudah digunakan akun lain." });
        return;
      }
    }

    const teacher = await prisma.$transaction(async (tx) => {
      if (d.email !== undefined) {
        await tx.user.update({ where: { id: existing.userId }, data: { email: d.email } });
      }
      if (d.isActive !== undefined) {
        await tx.user.update({ where: { id: existing.userId }, data: { isActive: d.isActive } });
      }

      return tx.teacher.update({
        where: { id },
        data: {
          ...(d.name !== undefined ? { name: d.name } : {}),
          ...(whatsapp !== undefined ? { whatsapp } : {}),
          ...(d.specialization !== undefined ? { specialization: d.specialization } : {}),
          ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        },
        include: {
          user: { select: { email: true, isActive: true } },
          classes: { select: { id: true, name: true }, where: { isActive: true } },
        },
      });
    });

    res.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        whatsapp: teacher.whatsapp,
        specialization: teacher.specialization,
        email: teacher.user.email,
        isActive: teacher.isActive && teacher.user.isActive,
        classes: teacher.classes,
      },
      message: "Data guru berhasil diperbarui.",
    });
  })
);

// DELETE /api/teachers/:id → soft delete (deleted_at + is_active=false, akun login ikut nonaktif)
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.teacher.findFirst({
      where: { id, user: { branchId }, deletedAt: null },
    });
    if (!existing) {
      res.status(404).json({ message: "Guru tidak ditemukan." });
      return;
    }

    await prisma.$transaction([
      prisma.teacher.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      }),
    ]);

    res.json({ message: "Guru dinonaktifkan." });
  })
);

export default router;
