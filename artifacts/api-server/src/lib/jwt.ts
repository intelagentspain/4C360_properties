import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export const AUTH_ROLES = ["owner", "pmo", "contractor", "vendor", "field_tech", "admin"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export interface AuthUser {
  userId: string;
  email: string;
  organizationId: string;
  role: AuthRole;
  permissions: string[];
}

export interface AuthTokenPayload extends AuthUser {
  tokenType: "access" | "refresh";
  iat?: number;
  exp?: number;
}

const ROLE_PERMISSIONS: Record<AuthRole, string[]> = {
  owner: ["read:*", "write:obligations", "write:evidence"],
  pmo: ["read:*", "write:projects", "write:programme", "write:risks"],
  contractor: ["read:assigned_projects", "write:progress"],
  vendor: ["read:assigned_work", "write:submissions"],
  field_tech: ["read:assignments", "write:evidence_uploads"],
  admin: ["*"],
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for authentication.`);
  }
  return value;
}

function getSecret(tokenType: "access" | "refresh"): Secret {
  return requireEnv(tokenType === "access" ? "JWT_SECRET" : "JWT_REFRESH_SECRET");
}

function assertRole(value: string | undefined): AuthRole {
  const role = value?.trim() || "admin";
  if ((AUTH_ROLES as readonly string[]).includes(role)) return role as AuthRole;
  throw new Error(`Invalid ADMIN_ROLE "${role}".`);
}

export function getPermissionsForRole(role: AuthRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

function signToken(user: AuthUser, tokenType: "access" | "refresh", expiresIn: SignOptions["expiresIn"]): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions,
      tokenType,
    } satisfies AuthTokenPayload,
    getSecret(tokenType),
    { expiresIn },
  );
}

export function generateAccessToken(user: AuthUser): string {
  return signToken(user, "access", "24h");
}

export function generateRefreshToken(user: AuthUser): string {
  return signToken(user, "refresh", "7d");
}

function verifyToken(token: string, tokenType: "access" | "refresh"): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret(tokenType)) as AuthTokenPayload;
  if (payload.tokenType !== tokenType) {
    throw new Error(`Expected ${tokenType} token.`);
  }
  if (!payload.userId || !payload.email || !payload.organizationId || !payload.role) {
    throw new Error("Token payload is missing required identity fields.");
  }
  return {
    ...payload,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : getPermissionsForRole(payload.role),
  };
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return verifyToken(token, "access");
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return verifyToken(token, "refresh");
}

export function getConfiguredAdminIdentity(): AuthUser {
  const role = assertRole(process.env.ADMIN_ROLE);
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  requireEnv("ADMIN_PASSWORD_HASH");

  return {
    userId: process.env.ADMIN_USER_ID?.trim() || "env-admin",
    email,
    organizationId: process.env.ADMIN_ORGANIZATION_ID?.trim() || "developmentx",
    role,
    permissions: getPermissionsForRole(role),
  };
}

export function publicUserResponse(user: AuthUser) {
  return {
    id: user.userId,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    permissions: user.permissions,
  };
}
