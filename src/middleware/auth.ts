import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { verifyFirebaseIdToken } from "../integrations/firebase/admin.js";
import { ensureAuthenticatedUser } from "../modules/auth/auth.service.js";
import { HttpError } from "../utils/http-error.js";

export type AuthenticatedRole = "user" | "community_moderator" | "community_founder" | "super_admin";

export interface AuthenticatedUser {
  id: number;
  firebaseUid: string;
  roles: AuthenticatedRole[];
  phoneNumber: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const readBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
};

export const authenticateUser = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (env.ALLOW_DEV_AUTH && env.NODE_ENV === "development") {
      const devFirebaseUid = req.header("x-dev-firebase-uid") ?? req.header("x-dev-user-id");
      if (devFirebaseUid) {
        const dbUser = await ensureAuthenticatedUser({
          firebaseUid: devFirebaseUid,
          mobileNumber: req.header("x-dev-mobile-number") ?? `+1000000${devFirebaseUid}`,
          fullName: req.header("x-dev-full-name") ?? "Development User"
        });

        req.user = {
          id: dbUser.id,
          firebaseUid: dbUser.firebaseUid,
          phoneNumber: dbUser.mobileNumber,
          roles: (req.header("x-dev-roles")?.split(",") as AuthenticatedRole[] | undefined) ?? ["user"]
        };
        next();
        return;
      }
    }

    const token = readBearerToken(req.header("authorization"));
    if (!token) {
      throw new HttpError(401, "Missing bearer token.", "AUTH_TOKEN_REQUIRED");
    }

    const decoded = await verifyFirebaseIdToken(token);
    const dbUser = await ensureAuthenticatedUser({
      firebaseUid: decoded.uid,
      mobileNumber: decoded.phone_number,
      fullName: typeof decoded.name === "string" ? decoded.name : null
    });

    req.user = {
      id: dbUser.id,
      firebaseUid: dbUser.firebaseUid,
      roles: ["user"],
      phoneNumber: dbUser.mobileNumber
    };
    next();
  } catch (error) {
    next(error);
  }
};
