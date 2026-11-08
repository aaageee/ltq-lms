import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Manajemen akun admin & staf: hanya SUPER_ADMIN
router.use(verifyToken, requireRole(["SUPER_ADMIN"]));

// Role yang boleh dikelola lewat modul ini (SUPER_ADMIN tidak boleh)
const MANAGED_ROLES = ["ADMIN_CABANG", "TU", "BENDAHARA"] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

// NFR: password min 8 karakter + minimal 1 angka
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/\d/, "Password wajib mengandung angka");

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().email("Email tidak valid"),
  password: passwordSchema,
  role: z.enum(MANAGED_ROLES),
  branchId: z.coerce.number().int().positive("Cabang wajib dipilih"),
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email("Email tidak valid").optional(),
  role: z.enum(MANAGED_ROLES).optional(),
  branchId: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admins → akun ADMIN_CABANG / TU / BENDAHARA
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const roleFilter = String(req.query.role ?? "").trim();
    const roles = MANAGED_ROLES.includes(roleFilter as ManagedRole)
      ? [roleFilter as ManagedRole]
      : [...MANAGED_ROLES];

    const users = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    res.json({ users });
  })
);

// POST /api/admins → buat akun admin cabang / TU / bendahara
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const emailTaken = await prisma.user.findUnique({ where: { email: d.email } });
    if (emailTaken) {
      res.status(409).json({ message: "Email sudah digunakan akun lain." });
      return;
    }

    const branch = await prisma.branch.findUnique({ where: { id: d.branchId } });
    if (!branch) {
      res.status(404).json({ message: "Cabang tidak ditemukan." });
      return;
    }

    const passwordHash = await bcrypt.hash(d.password, 12);

    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash,
        role: d.role,
        branchId: d.branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
    });

    res.status(201).json({ user, message: "Akun berhasil dibuat." });
  })
);

// PUT /api/admins/:id → edit nama/email/cabang/role
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = updateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (existing.role === "SUPER_ADMIN") {
      res.status(403).json({ message: "Akun SUPER_ADMIN tidak bisa diubah lewat modul ini." });
      return;
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (taken) {
        res.status(409).json({ message: "Email sudah digunakan akun lain." });
        return;
      }
    }

    if (parsed.data.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: parsed.data.branchId } });
      if (!branch) {
        res.status(404).json({ message: "Cabang tidak ditemukan." });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.branchId !== undefined ? { branchId: parsed.data.branchId } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    res.json({ user, message: "Akun berhasil diperbarui." });
  })
);

// POST /api/admins/:id/reset-password
router.post(
  "/:id/reset-password",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = z.object({ password: passwordSchema }).safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (existing.role === "SUPER_ADMIN") {
      res.status(403).json({ message: "Akun SUPER_ADMIN tidak bisa diubah lewat modul ini." });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    res.json({ message: "Password berhasil direset." });
  })
);

// POST /api/admins/:id/nonaktifkan
router.post(
  "/:id/nonaktifkan",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (existing.role === "SUPER_ADMIN") {
      res.status(403).json({ message: "Akun SUPER_ADMIN tidak bisa dinonaktifkan lewat modul ini." });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    res.json({ user, message: "Akun dinonaktifkan." });
  })
);

export default router;
