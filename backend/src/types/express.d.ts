import { TokenPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload; // di-inject middleware verifyToken
    }
  }
}

export {};
