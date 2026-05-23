import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

config({ path: resolve(backendRoot, ".env") });
config();

const localDatabaseUrl = "mysql://surfabroad:surfabroad@localhost:3306/surfabroad";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default(localDatabaseUrl),
  ADMIN_TOKEN_SECRET: z.string().optional(),
  ADMIN_TOKEN_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(720),
  ADMIN_SEED_USERNAME: z.string().default("admin"),
  ADMIN_SEED_PASSWORD: z.string().default("Admin@12345"),
  ADMIN_SEED_NAME: z.string().default("INHOD Admin"),
  ALLOW_DEV_AUTH: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  PAYMENT_GATEWAY: z.string().default("stripe"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["s3", "r2"]).default("s3"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);

process.env.DATABASE_URL = env.DATABASE_URL;

export const isProduction = env.NODE_ENV === "production";
