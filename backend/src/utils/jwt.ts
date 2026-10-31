import jwt from "jsonwebtoken";

// Payload standar untuk access & refresh token
export interface TokenPayload {
  sub: number; // user id
  email: string;
  role: string;
  branchId: number | null;
  iat?: number;
  exp?: number;
}

// "15m" / "7d" / "30s" / "1h" → detik (menghindari tipe StringValue dari jsonwebtoken)
function durationToSeconds(input: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(input.trim());
  if (!match) throw new Error(`Durasi token tidak valid: "${input}" (contoh: 15m, 7d)`);
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return value * multiplier;
}

export function signAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET belum di-set");
  return jwt.sign(payload, secret, {
    expiresIn: durationToSeconds(process.env.JWT_ACCESS_EXPIRES ?? "15m"),
  });
}

export function signRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET belum di-set");
  return jwt.sign(payload, secret, {
    expiresIn: durationToSeconds(process.env.JWT_REFRESH_EXPIRES ?? "7d"),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET belum di-set");
  return jwt.verify(token, secret) as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET belum di-set");
  return jwt.verify(token, secret) as unknown as TokenPayload;
}
