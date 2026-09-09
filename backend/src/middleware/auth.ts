import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: string; role: "OWNER" | "MANAGER" | "ADMIN" | "TENANT" };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

export function requireRole(...roles: Array<"OWNER" | "MANAGER" | "ADMIN" | "TENANT">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    return next();
  };
}
