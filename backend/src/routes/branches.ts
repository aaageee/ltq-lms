import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Manajemen cabang: hanya SUPER_ADMIN
router.use(verifyToken, requireRole(["SUPER_ADMIN"]));

const branchSchema = z.object({
  name: z.string().trim().min(2, "Nama cabang minimal 2 karakter").max(120),
  code: z.string().trim().min(2, "Kode cabang minimal 2 karakter").max(10),
  address: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  logoUrl: z.string().trim().max(255).nullable().optional(),
  bankAccount: z.string().trim().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/branches → semua cabang + jumlah peserta/kelas/guru
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            users: { where: { role: "GURU", isActive: true } },
          },
        },
      },
    });
    res.json({ branches });
  })
);

// POST /api/branches
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = branchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const code = parsed.data.code.toUpperCase();
    const existing = await prisma.branch.findUnique({ where: { code } });
    if (existing) {
      res.status(409).json({ message: `Kode cabang "${code}" sudah digunakan.` });
      return;
    }

    const branch = await prisma.branch.create({
      data: {
        name: parsed.data.name,
        code,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        logoUrl: parsed.data.logoUrl ?? null,
        bankAccount: parsed.data.bankAccount ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    res.status(201).json({ branch, message: "Cabang berhasil ditambahkan." });
  })
);

// PUT /api/branches/:id
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = branchSchema.partial().safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Cabang tidak ditemukan." });
      return;
    }

    if (parsed.data.code) {
      const code = parsed.data.code.toUpperCase();
      const taken = await prisma.branch.findFirst({ where: { code, id: { not: id } } });
      if (taken) {
        res.status(409).json({ message: `Kode cabang "${code}" sudah digunakan.` });
        return;
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.code !== undefined ? { code: parsed.data.code.toUpperCase() } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.logoUrl !== undefined ? { logoUrl: parsed.data.logoUrl } : {}),
        ...(parsed.data.bankAccount !== undefined ? { bankAccount: parsed.data.bankAccount } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });

    res.json({ branch, message: "Cabang berhasil diperbarui." });
  })
);

// DELETE /api/branches/:id → soft delete; cabang aktif terakhir tidak boleh dinonaktifkan
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Cabang tidak ditemukan." });
      return;
    }

    if (existing.isActive) {
      const activeCount = await prisma.branch.count({ where: { isActive: true } });
      if (activeCount <= 1) {
        res.status(409).json({ message: "Cabang aktif terakhir tidak boleh dinonaktifkan." });
        return;
      }
    }

    const branch = await prisma.branch.update({ where: { id }, data: { isActive: false } });
    res.json({ branch, message: "Cabang dinonaktifkan." });
  })
);

export default router;
