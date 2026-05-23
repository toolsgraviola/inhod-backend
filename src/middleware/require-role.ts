import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, AuthenticatedRole } from "./auth.js";
import { HttpError } from "../utils/http-error.js";

export const requireRole =
  (...roles: AuthenticatedRole[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      next(new HttpError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
      return;
    }

    next();
  };

