import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../modules/admin/admin-auth.service.js";
import { HttpError } from "../utils/http-error.js";

export interface AuthenticatedAdmin {
  id: number;
  username: string;
  name: string;
  role: string;
  status: boolean;
  lastLoginAt: Date | null;
}

export interface AdminRequest extends Request {
  admin?: AuthenticatedAdmin;
}

const readBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
};

export const authenticateAdmin = async (req: AdminRequest, _res: Response, next: NextFunction) => {
  try {
    const token = readBearerToken(req.header("authorization"));

    if (!token) {
      throw new HttpError(401, "Missing admin bearer token.", "ADMIN_TOKEN_REQUIRED");
    }

    req.admin = await verifyAdminToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireSuperAdmin = (req: AdminRequest, _res: Response, next: NextFunction) => {
  if (req.admin?.role !== "super_admin") {
    next(new HttpError(403, "Super Admin access is required.", "ADMIN_FORBIDDEN"));
    return;
  }

  next();
};

