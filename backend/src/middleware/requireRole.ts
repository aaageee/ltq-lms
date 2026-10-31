import { NextFunction, Request, Response } from "express";

// Middleware: cek role user (sudah di-inject verifyToken) terhadap daftar role yang diizinkan
// Contoh: requireRole(["ADMIN_CABANG", "TU"])
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Belum terautentikasi." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "Anda tidak punya akses ke resource ini.",
        required: allowedRoles,
        yourRole: req.user.role,
      });
      return;
    }
    next();
  };
}
