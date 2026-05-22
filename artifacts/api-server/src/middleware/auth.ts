import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";

type PublicRoute = {
  methods?: string[];
  pattern: RegExp;
};

const PUBLIC_ROUTES: PublicRoute[] = [
  { methods: ["GET"], pattern: /^\/healthz$/ },
  { methods: ["POST"], pattern: /^\/auth\/login$/ },
  { methods: ["POST"], pattern: /^\/auth\/refresh$/ },
  { pattern: /^\/public(?:\/|$)/ },
  { pattern: /^\/uploads(?:\/|$)/ },
  { methods: ["POST"], pattern: /^\/ai\/analyze-issue-image$/ },
  { methods: ["POST"], pattern: /^\/ai\/transcribe-and-analyze-voice$/ },
  { methods: ["GET"], pattern: /^\/push\/vapid-public-key$/ },
  { methods: ["POST"], pattern: /^\/push\/subscribe$/ },
  { methods: ["POST"], pattern: /^\/push\/unsubscribe$/ },
  { methods: ["POST"], pattern: /^\/incidents$/ },
  { methods: ["GET"], pattern: /^\/incidents\/[^/]+\/mute$/ },
  { methods: ["POST"], pattern: /^\/incidents\/[^/]+\/mute$/ },
  { methods: ["GET"], pattern: /^\/incidents\/[^/]+\/mute-status$/ },
  { methods: ["GET"], pattern: /^\/incidents\/[^/]+\/confirm-resolution$/ },
  { methods: ["POST"], pattern: /^\/incidents\/[^/]+\/confirm-resolution$/ },
  { methods: ["POST"], pattern: /^\/incidents\/[^/]+\/confirm-email$/ },
  { methods: ["GET"], pattern: /^\/tickets$/ },
  { methods: ["GET"], pattern: /^\/tickets\/[^/]+$/ },
  { methods: ["GET"], pattern: /^\/tickets\/[^/]+\/approve$/ },
  { methods: ["POST"], pattern: /^\/tickets\/[^/]+\/approve$/ },
  { methods: ["GET"], pattern: /^\/tickets\/[^/]+\/reject$/ },
  { methods: ["POST"], pattern: /^\/tickets\/[^/]+\/reject$/ },
  { methods: ["GET"], pattern: /^\/fieldops\/submissions$/ },
  { methods: ["POST"], pattern: /^\/fieldops\/submissions$/ },
];

function normalizedApiPath(req: Request): string {
  const withoutQuery = req.originalUrl.split("?")[0] || "/";
  const withoutApiPrefix = withoutQuery.replace(/^\/api(?=\/|$)/, "");
  return withoutApiPrefix || "/";
}

export function isPublicApiRoute(req: Request): boolean {
  const path = normalizedApiPath(req);
  return PUBLIC_ROUTES.some(route => {
    if (route.methods && !route.methods.includes(req.method.toUpperCase())) return false;
    return route.pattern.test(path);
  });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isPublicApiRoute(req)) {
    next();
    return;
  }

  const authorization = req.header("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    res.status(401).json({ ok: false, error: "Authentication required." });
    return;
  }

  try {
    const payload = verifyAccessToken(match[1]);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
      permissions: payload.permissions,
    };
    req.org = payload.organizationId;
    next();
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}
