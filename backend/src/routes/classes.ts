import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(verifyToken, requireRole(["ADMIN_CABANG"]));

const classSchema = z.object({
  name: z.string().trim().min(2, "Nama kelas minimal 2 karakter").max(100),
  programId: z.number().int().positive("Program wajib dipilih"),
  teacherId: z.number().int().positive().nullable().optional(),
  capacity: z.number().int().positive("Kapasitas minimal 1").max(500),
  scheduleDays: z.string().trim().min(1, "Jadwal hari wajib diisi").max(100),
  scheduleTime: z.string().trim().min(1, "Jadwal jam wajib diisi").max(100),
  room: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

function branchIdOf(req: Request): number | null {
  return req.user?.branchId ?? null;
}

// GET /api/classes → list kelas + program + guru + jumlah peserta aktif
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const classes = await prisma.class.findMany({
      where: { branchId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        program: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: { where: { status: "active" } } } },
      },
    });

    // map ke bentuk yang dipakai frontend
    const data = classes.map((c) => ({
      id: c.id,
      name: c.name,
      programId: c.programId,
      program: c.program,
      teacherId: c.teacherId,
      teacher: c.teacher,
      capacity: c.capacity,
      filled: c._count.enrollments,
      scheduleDays: c.scheduleDays,
      scheduleTime: c.scheduleTime,
      room: c.room,
      isActive: c.isActive,
    }));

    res.json({ classes: data });
  })
);

// POST /api/classes → buat kelas baru
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const parsed = classSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    // program harus milik cabang yang sama
    const program = await prisma.program.findFirst({ where: { id: d.programId, branchId } });
    if (!program) {
      res.status(404).json({ message: "Program tidak ditemukan di cabang ini." });
      return;
    }

    if (d.teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: d.teacherId, isActive: true, deletedAt: null },
      });
      if (!teacher) {
        res.status(404).json({ message: "Guru tidak ditemukan atau tidak aktif." });
        return;
      }
    }

    const created = await prisma.class.create({
      data: {
        branchId,
        programId: d.programId,
        teacherId: d.teacherId ?? null,
        name: d.name,
        capacity: d.capacity,
        scheduleDays: d.scheduleDays,
        scheduleTime: d.scheduleTime,
        room: d.room ?? null,
        isActive: d.isActive ?? true,
      },
      include: {
        program: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      class: { ...created, filled: 0 },
      message: "Kelas berhasil ditambahkan.",
    });
  })
);

// PUT /api/classes/:id → edit kelas / assign-ganti guru
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = classSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const existing = await prisma.class.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Kelas tidak ditemukan." });
      return;
    }

    if (d.programId !== undefined) {
      const program = await prisma.program.findFirst({ where: { id: d.programId, branchId } });
      if (!program) {
        res.status(404).json({ message: "Program tidak ditemukan di cabang ini." });
        return;
      }
    }

    if (d.teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: d.teacherId, isActive: true, deletedAt: null },
      });
      if (!teacher) {
        res.status(404).json({ message: "Guru tidak ditemukan atau tidak aktif." });
        return;
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.programId !== undefined ? { programId: d.programId } : {}),
        ...(d.teacherId !== undefined ? { teacherId: d.teacherId } : {}),
        ...(d.capacity !== undefined ? { capacity: d.capacity } : {}),
        ...(d.scheduleDays !== undefined ? { scheduleDays: d.scheduleDays } : {}),
        ...(d.scheduleTime !== undefined ? { scheduleTime: d.scheduleTime } : {}),
        ...(d.room !== undefined ? { room: d.room } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
      include: {
        program: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: { where: { status: "active" } } } },
      },
    });

    res.json({
      class: { ...updated, filled: updated._count.enrollments },
      message: "Kelas berhasil diperbarui.",
    });
  })
);

// DELETE /api/classes/:id → soft delete (is_active = false)
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.class.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Kelas tidak ditemukan." });
      return;
    }

    const updated = await prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ class: updated, message: "Kelas dinonaktifkan." });
  })
);

export default router;
