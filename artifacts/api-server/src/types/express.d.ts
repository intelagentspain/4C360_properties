import type { AuthRole } from "../lib/jwt";

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      organizationId: string;
      role: AuthRole;
      permissions: string[];
    }

    interface Request {
      user?: User;
      org?: string;
    }
  }
}

export {};
