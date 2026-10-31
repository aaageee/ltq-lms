import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";

// Middleware: validasi JWT dari header Authorization: Bearer <token>
// Jika valid, inject user (TokenPayload) ke req.user
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token tidak ditemukan. Silakan login ulang." });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau kedaluwarsa. Silakan login ulang." });
  }
}
