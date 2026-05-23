import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";

export const rejoinPolicies = [
  "pay_every_time",
  "free_rejoin_within_days",
  "lifetime_access",
  "moderator_controlled"
] as const;

export type RejoinPolicy = (typeof rejoinPolicies)[number];

export type PlatformSettings = {
  baseJoinFeeUsd: string;
  platformSharePercent: number;
  founderSharePercent: number;
  rejoinPolicy: RejoinPolicy;
  rejoinFreeDays: number | null;
  communityCreateUpfrontFeeUsd: string;
  communityCreateBarterSharePercent: number;
  communityCreateBarterMemberLimit: number;
};

export type PlatformSettingsResponse = PlatformSettings & {
  updatedAt: Date | null;
};

export type ApiIntegrationSettings = {
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  googleMapsApiKey: string;
  awsS3Bucket: string;
  awsS3Region: string;
  awsS3AccessKeyId: string;
  awsS3SecretAccessKey: string;
  awsS3EndpointUrl: string;
  awsS3PublicBaseUrl: string;
  awsS3KeyPrefix: string;
  awsS3ForcePathStyle: boolean;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseAdminClientEmail: string;
  firebaseAdminPrivateKey: string;
};

export type ApiIntegrationSettingsResponse = ApiIntegrationSettings & {
  stripeConfigured: boolean;
  googleMapsConfigured: boolean;
  awsS3Configured: boolean;
  firebaseClientConfigured: boolean;
  firebaseAdminConfigured: boolean;
  firebaseAuthConfigured: boolean;
  updatedAt: Date | null;
};

const platformSettingsKey = "platform_settings";
const apiIntegrationSettingsKey = "api_integration_settings";

const defaultPlatformSettings: PlatformSettings = {
  baseJoinFeeUsd: "1.00",
  platformSharePercent: 50,
  founderSharePercent: 50,
  rejoinPolicy: "pay_every_time",
  rejoinFreeDays: null,
  communityCreateUpfrontFeeUsd: "10.00",
  communityCreateBarterSharePercent: 10,
  communityCreateBarterMemberLimit: 500
};

const defaultApiIntegrationSettings: ApiIntegrationSettings = {
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  googleMapsApiKey: "",
  awsS3Bucket: "",
  awsS3Region: "",
  awsS3AccessKeyId: "",
  awsS3SecretAccessKey: "",
  awsS3EndpointUrl: "",
  awsS3PublicBaseUrl: "",
  awsS3KeyPrefix: "media",
  awsS3ForcePathStyle: false,
  firebaseApiKey: "",
  firebaseAuthDomain: "",
  firebaseProjectId: "",
  firebaseStorageBucket: "",
  firebaseMessagingSenderId: "",
  firebaseAppId: "",
  firebaseAdminClientEmail: "",
  firebaseAdminPrivateKey: ""
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const readBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const readRejoinPolicy = (value: unknown): RejoinPolicy =>
  typeof value === "string" && rejoinPolicies.includes(value as RejoinPolicy)
    ? (value as RejoinPolicy)
    : defaultPlatformSettings.rejoinPolicy;

const normalizeSettings = (value: unknown): PlatformSettings => {
  if (!isRecord(value)) {
    return defaultPlatformSettings;
  }

  return {
    baseJoinFeeUsd: readString(value.baseJoinFeeUsd, defaultPlatformSettings.baseJoinFeeUsd),
    platformSharePercent: readNumber(
      value.platformSharePercent,
      defaultPlatformSettings.platformSharePercent
    ),
    founderSharePercent: readNumber(
      value.founderSharePercent,
      defaultPlatformSettings.founderSharePercent
    ),
    rejoinPolicy: readRejoinPolicy(value.rejoinPolicy),
    rejoinFreeDays:
      value.rejoinFreeDays === null || value.rejoinFreeDays === undefined
        ? null
        : readNumber(value.rejoinFreeDays, 0),
    communityCreateUpfrontFeeUsd: readString(
      value.communityCreateUpfrontFeeUsd,
      defaultPlatformSettings.communityCreateUpfrontFeeUsd
    ),
    communityCreateBarterSharePercent: readNumber(
      value.communityCreateBarterSharePercent,
      defaultPlatformSettings.communityCreateBarterSharePercent
    ),
    communityCreateBarterMemberLimit: readNumber(
      value.communityCreateBarterMemberLimit,
      defaultPlatformSettings.communityCreateBarterMemberLimit
    )
  };
};

const normalizeApiIntegrationSettings = (value: unknown): ApiIntegrationSettings => {
  if (!isRecord(value)) {
    return defaultApiIntegrationSettings;
  }

  return {
    stripePublishableKey: readString(
      value.stripePublishableKey,
      defaultApiIntegrationSettings.stripePublishableKey
    ),
    stripeSecretKey: readString(value.stripeSecretKey, defaultApiIntegrationSettings.stripeSecretKey),
    stripeWebhookSecret: readString(
      value.stripeWebhookSecret,
      defaultApiIntegrationSettings.stripeWebhookSecret
    ),
    googleMapsApiKey: readString(value.googleMapsApiKey, defaultApiIntegrationSettings.googleMapsApiKey),
    awsS3Bucket: readString(value.awsS3Bucket, defaultApiIntegrationSettings.awsS3Bucket),
    awsS3Region: readString(value.awsS3Region, defaultApiIntegrationSettings.awsS3Region),
    awsS3AccessKeyId: readString(value.awsS3AccessKeyId, defaultApiIntegrationSettings.awsS3AccessKeyId),
    awsS3SecretAccessKey: readString(
      value.awsS3SecretAccessKey,
      defaultApiIntegrationSettings.awsS3SecretAccessKey
    ),
    awsS3EndpointUrl: readString(value.awsS3EndpointUrl, defaultApiIntegrationSettings.awsS3EndpointUrl),
    awsS3PublicBaseUrl: readString(
      value.awsS3PublicBaseUrl,
      defaultApiIntegrationSettings.awsS3PublicBaseUrl
    ),
    awsS3KeyPrefix: readString(value.awsS3KeyPrefix, defaultApiIntegrationSettings.awsS3KeyPrefix),
    awsS3ForcePathStyle: readBoolean(
      value.awsS3ForcePathStyle,
      defaultApiIntegrationSettings.awsS3ForcePathStyle
    ),
    firebaseApiKey: readString(value.firebaseApiKey, defaultApiIntegrationSettings.firebaseApiKey),
    firebaseAuthDomain: readString(
      value.firebaseAuthDomain,
      defaultApiIntegrationSettings.firebaseAuthDomain
    ),
    firebaseProjectId: readString(value.firebaseProjectId, defaultApiIntegrationSettings.firebaseProjectId),
    firebaseStorageBucket: readString(
      value.firebaseStorageBucket,
      defaultApiIntegrationSettings.firebaseStorageBucket
    ),
    firebaseMessagingSenderId: readString(
      value.firebaseMessagingSenderId,
      defaultApiIntegrationSettings.firebaseMessagingSenderId
    ),
    firebaseAppId: readString(value.firebaseAppId, defaultApiIntegrationSettings.firebaseAppId),
    firebaseAdminClientEmail: readString(
      value.firebaseAdminClientEmail,
      defaultApiIntegrationSettings.firebaseAdminClientEmail
    ),
    firebaseAdminPrivateKey: readString(
      value.firebaseAdminPrivateKey,
      defaultApiIntegrationSettings.firebaseAdminPrivateKey
    )
  };
};

const withIntegrationFlags = (
  settings: ApiIntegrationSettings,
  updatedAt: Date | null
): ApiIntegrationSettingsResponse => {
  const firebaseClientConfigured = Boolean(
    settings.firebaseApiKey &&
      settings.firebaseProjectId &&
      settings.firebaseMessagingSenderId &&
      settings.firebaseAppId
  );
  const firebaseAdminConfigured = Boolean(
    env.GOOGLE_APPLICATION_CREDENTIALS ||
      (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) ||
      (settings.firebaseProjectId &&
        settings.firebaseAdminClientEmail &&
        settings.firebaseAdminPrivateKey)
  );

  return {
    ...settings,
    stripeConfigured: Boolean(settings.stripeSecretKey && settings.stripePublishableKey),
    googleMapsConfigured: Boolean(settings.googleMapsApiKey),
    awsS3Configured: Boolean(
      settings.awsS3Bucket &&
        settings.awsS3Region &&
        settings.awsS3AccessKeyId &&
        settings.awsS3SecretAccessKey
    ),
    firebaseClientConfigured,
    firebaseAdminConfigured,
    firebaseAuthConfigured: firebaseClientConfigured && firebaseAdminConfigured,
    updatedAt
  };
};

export const getPlatformSettings = async (): Promise<PlatformSettingsResponse> => {
  const setting = await prisma.adminSetting.findUnique({
    where: {
      key: platformSettingsKey
    }
  });

  return {
    ...normalizeSettings(setting?.value),
    updatedAt: setting?.updatedAt ?? null
  };
};

export const updatePlatformSettings = async (
  adminId: number,
  input: PlatformSettings
): Promise<PlatformSettingsResponse> => {
  const settings = normalizeSettings(input);
  const setting = await prisma.adminSetting.upsert({
    where: {
      key: platformSettingsKey
    },
    create: {
      key: platformSettingsKey,
      value: settings as Prisma.InputJsonValue,
      updatedByAdminId: adminId
    },
    update: {
      value: settings as Prisma.InputJsonValue,
      updatedByAdminId: adminId
    }
  });

  return {
    ...settings,
    updatedAt: setting.updatedAt
  };
};

export const getApiIntegrationSettings = async (): Promise<ApiIntegrationSettingsResponse> => {
  const setting = await prisma.adminSetting.findUnique({
    where: {
      key: apiIntegrationSettingsKey
    }
  });

  return withIntegrationFlags(normalizeApiIntegrationSettings(setting?.value), setting?.updatedAt ?? null);
};

export const updateApiIntegrationSettings = async (
  adminId: number,
  input: Partial<ApiIntegrationSettings>
): Promise<ApiIntegrationSettingsResponse> => {
  const existing = await getApiIntegrationSettings();
  const settings = normalizeApiIntegrationSettings({
    ...existing,
    ...input
  });

  const setting = await prisma.adminSetting.upsert({
    where: {
      key: apiIntegrationSettingsKey
    },
    create: {
      key: apiIntegrationSettingsKey,
      value: settings as Prisma.InputJsonValue,
      updatedByAdminId: adminId
    },
    update: {
      value: settings as Prisma.InputJsonValue,
      updatedByAdminId: adminId
    }
  });

  return withIntegrationFlags(settings, setting.updatedAt);
};
