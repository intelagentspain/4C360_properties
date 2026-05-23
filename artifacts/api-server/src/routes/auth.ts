import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import {
  generateAccessToken,
  generateRefreshToken,
  getConfiguredAdminIdentity,
  getPermissionsForRole,
  isDemoAuthEnabled,
  publicUserResponse,
  verifyRefreshToken,
  type AuthUser,
} from "../lib/jwt";
import { logger } from "../lib/logger";

const router = Router();
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD?.trim() || "password";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many login attempts. Please try again in a few minutes." },
});

function configuredAdminOrNull(): AuthUser | null {
  try {
    return getConfiguredAdminIdentity();
  } catch (error) {
    logger.warn({ err: error }, "Authentication is not fully configured");
    return null;
  }
}

function issueSession(user: AuthUser) {
  return {
    token: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: publicUserResponse(user),
  };
}

function hasSecurePasswordHash(passwordHash: string): boolean {
  try {
    return bcrypt.getRounds(passwordHash) >= 10;
  } catch {
    return false;
  }
}

router.post("/auth/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  if (!normalizedEmail || !password) {
    res.status(400).json({ ok: false, error: "Email and password are required." });
    return;
  }

  const admin = configuredAdminOrNull();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!admin) {
    res.status(503).json({ ok: false, error: "Authentication is not configured." });
    return;
  }

  if (!passwordHash && isDemoAuthEnabled()) {
    if (normalizedEmail !== admin.email || password !== DEMO_ADMIN_PASSWORD) {
      res.status(401).json({ ok: false, error: "Invalid credentials." });
      return;
    }

    logger.warn({ email: admin.email }, "Using demo authentication fallback");
    res.json(issueSession(admin));
    return;
  }

  if (!passwordHash) {
    res.status(503).json({ ok: false, error: "Authentication is not configured." });
    return;
  }

  if (!hasSecurePasswordHash(passwordHash)) {
    logger.error("ADMIN_PASSWORD_HASH is missing a bcrypt cost factor of at least 10");
    res.status(503).json({ ok: false, error: "Authentication password hash is not configured securely." });
    return;
  }

  if (normalizedEmail !== admin.email) {
    res.status(401).json({ ok: false, error: "Invalid credentials." });
    return;
  }

  const validPassword = await bcrypt.compare(password, passwordHash);
  if (!validPassword) {
    res.status(401).json({ ok: false, error: "Invalid credentials." });
    return;
  }

  res.json(issueSession(admin));
});

router.post("/auth/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ ok: false, error: "Refresh token is required." });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user: AuthUser = {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
      permissions: payload.permissions.length > 0 ? payload.permissions : getPermissionsForRole(payload.role),
    };
    res.json(issueSession(user));
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired refresh token." });
  }
});

router.get("/auth/me", (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ ok: false, error: "Authentication required." });
    return;
  }

  res.json({ user: publicUserResponse(req.user) });
});

export default router;
