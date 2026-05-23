import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "base64url");

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
};

