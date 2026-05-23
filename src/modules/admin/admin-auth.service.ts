import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../database/prisma.js";
import { env, isProduction } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { verifyPassword } from "../../utils/password.js";

type AdminTokenPayload = {
  sub: number;
  username: string;
  role: string;
  exp: number;
};

const getTokenSecret = () => {
  if (env.ADMIN_TOKEN_SECRET) {
    return env.ADMIN_TOKEN_SECRET;
  }

  if (isProduction) {
    throw new HttpError(500, "Admin token secret is not configured.", "ADMIN_SECRET_REQUIRED");
  }

  return "surfabroad-local-admin-secret";
};

const base64UrlEncode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const base64UrlDecode = <T>(value: string) => JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;

const sign = (content: string) =>
  createHmac("sha256", getTokenSecret()).update(content).digest("base64url");

const createAdminToken = (payload: Omit<AdminTokenPayload, "exp">) => {
  const tokenPayload: AdminTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + env.ADMIN_TOKEN_EXPIRES_IN_MINUTES * 60
  };
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncode(tokenPayload);
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
};

const verifyAdminTokenSignature = (content: string, signature: string) => {
  const expected = Buffer.from(sign(content), "base64url");
  const actual = Buffer.from(signature, "base64url");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
};

export const serializeAdminUser = (admin: {
  id: number;
  username: string;
  name: string;
  role: string;
  status: boolean;
  lastLoginAt: Date | null;
}) => ({
  id: admin.id,
  username: admin.username,
  name: admin.name,
  role: admin.role,
  status: admin.status,
  lastLoginAt: admin.lastLoginAt
});

export const loginAdmin = async (username: string, password: string) => {
  const admin = await prisma.adminUser.findUnique({
    where: { username: username.trim().toLowerCase() }
  });

  if (!admin || !admin.status || !verifyPassword(password, admin.passwordHash)) {
    throw new HttpError(401, "Invalid admin username or password.", "ADMIN_LOGIN_FAILED");
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    admin: serializeAdminUser(updated),
    token: createAdminToken({
      sub: updated.id,
      username: updated.username,
      role: updated.role
    })
  };
};

export const verifyAdminToken = async (token: string) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new HttpError(401, "Invalid admin token.", "ADMIN_TOKEN_INVALID");
  }

  const [header, body, signature] = parts;
  if (!verifyAdminTokenSignature(`${header}.${body}`, signature)) {
    throw new HttpError(401, "Invalid admin token.", "ADMIN_TOKEN_INVALID");
  }

  let payload: AdminTokenPayload;
  try {
    payload = base64UrlDecode<AdminTokenPayload>(body);
  } catch {
    throw new HttpError(401, "Invalid admin token.", "ADMIN_TOKEN_INVALID");
  }

  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "Admin token has expired.", "ADMIN_TOKEN_EXPIRED");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub }
  });

  if (!admin || !admin.status) {
    throw new HttpError(401, "Admin account is not active.", "ADMIN_INACTIVE");
  }

  return serializeAdminUser(admin);
};
