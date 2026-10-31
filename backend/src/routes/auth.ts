import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();
const prisma = new PrismaClient();

const REFRESH_COOKIE = "refresh_token";

// Zod schema: body login
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// helper: set cookie refresh token (httpOnly, 7 hari)
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  });
}

// POST /api/auth/login → return accessToken + set refreshToken cookie
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // pesan sama untuk email tak dikenal & password salah (anti user-enumeration)
    res.status(401).json({ message: "Email atau password salah" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: "Email atau password salah" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ message: "Akun tidak aktif. Hubungi admin cabang." });
    return;
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    },
  });
});

// POST /api/auth/refresh → ambil refreshToken dari cookie → return accessToken baru
router.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ message: "Refresh token tidak ditemukan. Silakan login ulang." });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    // pastikan user masih ada & aktif
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      res.status(401).json({ message: "Akun tidak ditemukan atau tidak aktif." });
      return;
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Refresh token tidak valid atau kedaluwarsa. Silakan login ulang." });
  }
});

// POST /api/auth/logout → clear cookie
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ message: "Berhasil logout" });
});

// GET /api/auth/me → info user dari token (dipakai frontend untuk hydrate state)
router.get("/me", verifyToken, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, role: true, branchId: true, isActive: true },
  });
  if (!user || !user.isActive) {
    res.status(401).json({ message: "Akun tidak ditemukan atau tidak aktif." });
    return;
  }
  res.json({ user });
});

export default router;
