import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Semua endpoint: hanya ADMIN_CABANG
router.use(verifyToken, requireRole(["ADMIN_CABANG"]));

const programSchema = z.object({
  name: z.string().trim().min(2, "Nama program minimal 2 karakter").max(100),
  isActive: z.boolean().optional(),
});

// helper: ambil branchId admin yang login
function branchIdOf(req: Request): number | null {
  return req.user?.branchId ?? null;
}

// GET /api/programs → list program milik cabang (semua, termasuk nonaktif)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const programs = await prisma.program.findMany({
      where: { branchId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { classes: true } } },
    });

    res.json({ programs });
  })
);

// POST /api/programs → buat program baru
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun admin belum terhubung ke cabang." });
      return;
    }

    const parsed = programSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const program = await prisma.program.create({
      data: { branchId, name: parsed.data.name, isActive: parsed.data.isActive ?? true },
    });

    res.status(201).json({ program, message: "Program berhasil ditambahkan." });
  })
);

// PUT /api/programs/:id → edit program
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = programSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.program.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Program tidak ditemukan." });
      return;
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });

    res.json({ program, message: "Program berhasil diperbarui." });
  })
);

// DELETE /api/programs/:id → soft delete (is_active = false)
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.program.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Program tidak ditemukan." });
      return;
    }

    const program = await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ program, message: "Program dinonaktifkan." });
  })
);

export default router;
