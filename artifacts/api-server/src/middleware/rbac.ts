import type { NextFunction, Request, Response } from "express";
import type { AuthRole } from "../lib/jwt";

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: "Authentication required." });
      return;
    }

    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({ ok: false, error: "You do not have permission to perform this action." });
  };
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: "Authentication required." });
      return;
    }

    if (req.user.permissions.includes("*") || permissions.some(permission => req.user?.permissions.includes(permission))) {
      next();
      return;
    }

    res.status(403).json({ ok: false, error: "You do not have permission to perform this action." });
  };
}
