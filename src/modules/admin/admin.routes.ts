import { Router } from "express";
import { z } from "zod";
import { CommunityStatus, ReportStatus, ReportTargetType, UserStatus } from "@prisma/client";
import { authenticateAdmin, requireSuperAdmin, type AdminRequest } from "../../middleware/admin-auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { parseId } from "../../utils/parse-id.js";
import { listCommunities, reviewCommunity } from "../communities/communities.service.js";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";
import { loginAdmin } from "./admin-auth.service.js";
import { getAdminAccounting } from "./admin-accounting.service.js";
import {
  createCommunityCategory,
  createInterest,
  listAdminCommunityCategories,
  listAdminInterests,
  updateCommunityCategory,
  updateInterest
} from "./admin-catalog.service.js";
import {
  getAdminOverview,
  listAdminReports,
  listAdminUsers
} from "./admin-dashboard.service.js";
import {
  createLanguage,
  listAdminLanguages,
  updateLanguage
} from "./admin-languages.service.js";
import {
  createCity,
  createCountry,
  createState,
  listAdminCities,
  listAdminCountries,
  listAdminStates,
  updateCity,
  updateCountry,
  updateState
} from "./admin-locations.service.js";
import {
  getApiIntegrationSettings,
  getPlatformSettings,
  rejoinPolicies,
  updateApiIntegrationSettings,
  updatePlatformSettings
} from "./admin-settings.service.js";

export const adminRouter = Router();

const optionalBoolean = z.boolean().optional();

const loginSchema = z.object({
  username: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(256)
});

const createCountrySchema = z.object({
  name: z.string().trim().min(2).max(120),
  isoCode: z.string().trim().min(2).max(3),
  currencyCode: z.string().trim().length(3),
  phoneCode: z.string().trim().min(1).max(10).nullable().optional(),
  status: optionalBoolean
});

const updateCountrySchema = createCountrySchema.partial();

const createStateSchema = z.object({
  countryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(20).nullable().optional(),
  status: optionalBoolean
});

const updateStateSchema = createStateSchema.partial();

const createCitySchema = z.object({
  countryId: z.number().int().positive(),
  stateId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2).max(120),
  status: optionalBoolean
});

const updateCitySchema = createCitySchema.partial();

const createLanguageSchema = z.object({
  code: z.string().trim().min(2).max(12).regex(/^[a-zA-Z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  nativeName: z.string().trim().min(1).max(120).nullable().optional(),
  status: optionalBoolean
});

const updateLanguageSchema = createLanguageSchema.partial();

const createCommunityCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(120).nullable().optional(),
  status: optionalBoolean
});

const updateCommunityCategorySchema = createCommunityCategorySchema.partial();

const createInterestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  status: optionalBoolean
});

const updateInterestSchema = createInterestSchema.partial();

const platformSettingsSchema = z
  .object({
    baseJoinFeeUsd: z.coerce.number().positive().max(1000).transform((value) => value.toFixed(2)),
    platformSharePercent: z.coerce.number().min(0).max(100),
    founderSharePercent: z.coerce.number().min(0).max(100),
    rejoinPolicy: z.enum(rejoinPolicies),
    rejoinFreeDays: z
      .preprocess((value) => (value === "" ? null : value), z.coerce.number().int().positive().nullable())
      .optional(),
    communityCreateUpfrontFeeUsd: z.coerce.number().positive().max(10000).transform((value) => value.toFixed(2)),
    communityCreateBarterSharePercent: z.coerce.number().min(0).max(100),
    communityCreateBarterMemberLimit: z.coerce.number().int().positive().max(1000000)
  })
  .refine(
    (input) =>
      Math.round((input.platformSharePercent + input.founderSharePercent) * 100) / 100 === 100,
    {
      message: "Platform and founder share must total 100%.",
      path: ["founderSharePercent"]
    }
  )
  .refine(
    (input) => input.rejoinPolicy !== "free_rejoin_within_days" || Boolean(input.rejoinFreeDays),
    {
      message: "Free rejoin days is required for this policy.",
      path: ["rejoinFreeDays"]
    }
  )
  .transform((input) => ({
    ...input,
    rejoinFreeDays:
      input.rejoinPolicy === "free_rejoin_within_days" ? input.rejoinFreeDays ?? null : null
  }));

const apiIntegrationSettingsSchema = z.object({
  stripePublishableKey: z.string().trim().max(500).optional(),
  stripeSecretKey: z.string().trim().max(500).optional(),
  stripeWebhookSecret: z.string().trim().max(500).optional(),
  googleMapsApiKey: z.string().trim().max(500).optional(),
  awsS3Bucket: z.string().trim().max(300).optional(),
  awsS3Region: z.string().trim().max(100).optional(),
  awsS3AccessKeyId: z.string().trim().max(300).optional(),
  awsS3SecretAccessKey: z.string().trim().max(500).optional(),
  awsS3EndpointUrl: z.string().trim().max(800).optional(),
  awsS3PublicBaseUrl: z.string().trim().max(800).optional(),
  awsS3KeyPrefix: z.string().trim().max(300).optional(),
  awsS3ForcePathStyle: z.boolean().optional(),
  firebaseApiKey: z.string().trim().max(500).optional(),
  firebaseAuthDomain: z.string().trim().max(500).optional(),
  firebaseProjectId: z.string().trim().max(200).optional(),
  firebaseStorageBucket: z.string().trim().max(500).optional(),
  firebaseMessagingSenderId: z.string().trim().max(200).optional(),
  firebaseAppId: z.string().trim().max(300).optional(),
  firebaseAdminClientEmail: z.string().trim().max(500).optional(),
  firebaseAdminPrivateKey: z.string().trim().max(5000).optional()
});

const reviewCommunitySchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED"]),
  adminReviewNote: z.string().trim().max(3000).nullable().optional()
});

const parseOptionalId = (value: unknown, label: string) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return parseId(String(value), label);
};

const parseEnum = <T extends string>(
  value: unknown,
  options: Record<string, T>
) => {
  if (typeof value !== "string") return undefined;
  const values = Object.values(options);
  return values.includes(value as T) ? (value as T) : undefined;
};

adminRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    res.status(200).json(await loginAdmin(payload.username, payload.password));
  })
);

adminRouter.use(authenticateAdmin, requireSuperAdmin);

adminRouter.get("/auth/me", (req: AdminRequest, res) => {
  res.status(200).json({ admin: req.admin });
});

adminRouter.post("/auth/logout", (_req, res) => {
  res.status(204).send();
});

adminRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    res.status(200).json(await getAdminOverview());
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const status = parseEnum(req.query.status, UserStatus);
    res.status(200).json({ items: await listAdminUsers(status) });
  })
);

adminRouter.get(
  "/communities",
  asyncHandler(async (req, res) => {
    const status =
      typeof req.query.status === "string" && req.query.status in CommunityStatus
        ? (req.query.status as CommunityStatus)
        : undefined;

    res.status(200).json({ items: await listCommunities({ status }) });
  })
);

adminRouter.patch(
  "/communities/:communityId/review",
  asyncHandler(async (req: AdminRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const payload = reviewCommunitySchema.parse(req.body);
    res.status(200).json({
      item: await reviewCommunity(communityId, req.admin!.id, payload)
    });
  })
);

adminRouter.get(
  "/reports",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      items: await listAdminReports({
        status: parseEnum(req.query.status, ReportStatus),
        targetType: parseEnum(req.query.targetType, ReportTargetType)
      })
    });
  })
);

adminRouter.get(
  "/payments",
  asyncHandler(async (_req, res) => {
    res.status(200).json(await getAdminAccounting());
  })
);

adminRouter.get(
  "/settings/platform",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ settings: await getPlatformSettings() });
  })
);

adminRouter.patch(
  "/settings/platform",
  asyncHandler(async (req: AdminRequest, res) => {
    const payload = platformSettingsSchema.parse(req.body);
    res.status(200).json({
      settings: await updatePlatformSettings(req.admin!.id, payload)
    });
  })
);

adminRouter.get(
  "/settings/apis",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ settings: await getApiIntegrationSettings() });
  })
);

adminRouter.patch(
  "/settings/apis",
  asyncHandler(async (req: AdminRequest, res) => {
    const payload = apiIntegrationSettingsSchema.parse(req.body);
    res.status(200).json({
      settings: await updateApiIntegrationSettings(req.admin!.id, payload)
    });
  })
);

adminRouter.get(
  "/locations/countries",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listAdminCountries() });
  })
);

adminRouter.post(
  "/locations/countries",
  asyncHandler(async (req, res) => {
    const payload = createCountrySchema.parse(req.body);
    res.status(201).json({ item: await createCountry(payload) });
  })
);

adminRouter.patch(
  "/locations/countries/:countryId",
  asyncHandler(async (req, res) => {
    const countryId = parseId(req.params.countryId, "countryId");
    const payload = updateCountrySchema.parse(req.body);
    res.status(200).json({ item: await updateCountry(countryId, payload) });
  })
);

adminRouter.get(
  "/locations/states",
  asyncHandler(async (req, res) => {
    const countryId = parseOptionalId(req.query.countryId, "countryId");
    res.status(200).json({ items: await listAdminStates(countryId) });
  })
);

adminRouter.post(
  "/locations/states",
  asyncHandler(async (req, res) => {
    const payload = createStateSchema.parse(req.body);
    res.status(201).json({ item: await createState(payload) });
  })
);

adminRouter.patch(
  "/locations/states/:stateId",
  asyncHandler(async (req, res) => {
    const stateId = parseId(req.params.stateId, "stateId");
    const payload = updateStateSchema.parse(req.body);
    res.status(200).json({ item: await updateState(stateId, payload) });
  })
);

adminRouter.get(
  "/locations/cities",
  asyncHandler(async (req, res) => {
    const countryId = parseOptionalId(req.query.countryId, "countryId");
    const stateId = parseOptionalId(req.query.stateId, "stateId");
    res.status(200).json({ items: await listAdminCities({ countryId, stateId }) });
  })
);

adminRouter.post(
  "/locations/cities",
  asyncHandler(async (req, res) => {
    const payload = createCitySchema.parse(req.body);
    res.status(201).json({ item: await createCity(payload) });
  })
);

adminRouter.patch(
  "/locations/cities/:cityId",
  asyncHandler(async (req, res) => {
    const cityId = parseId(req.params.cityId, "cityId");
    const payload = updateCitySchema.parse(req.body);
    res.status(200).json({ item: await updateCity(cityId, payload) });
  })
);

adminRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listAdminLanguages() });
  })
);

adminRouter.post(
  "/languages",
  asyncHandler(async (req, res) => {
    const payload = createLanguageSchema.parse(req.body);
    res.status(201).json({ item: await createLanguage(payload) });
  })
);

adminRouter.patch(
  "/languages/:languageId",
  asyncHandler(async (req, res) => {
    const languageId = parseId(req.params.languageId, "languageId");
    const payload = updateLanguageSchema.parse(req.body);
    res.status(200).json({ item: await updateLanguage(languageId, payload) });
  })
);

adminRouter.get(
  "/community-categories",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listAdminCommunityCategories() });
  })
);

adminRouter.post(
  "/community-categories",
  asyncHandler(async (req, res) => {
    const payload = createCommunityCategorySchema.parse(req.body);
    res.status(201).json({ item: await createCommunityCategory(payload) });
  })
);

adminRouter.patch(
  "/community-categories/:categoryId",
  asyncHandler(async (req, res) => {
    const categoryId = parseId(req.params.categoryId, "categoryId");
    const payload = updateCommunityCategorySchema.parse(req.body);
    res.status(200).json({ item: await updateCommunityCategory(categoryId, payload) });
  })
);

adminRouter.get(
  "/interests",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listAdminInterests() });
  })
);

adminRouter.post(
  "/interests",
  asyncHandler(async (req, res) => {
    const payload = createInterestSchema.parse(req.body);
    res.status(201).json({ item: await createInterest(payload) });
  })
);

adminRouter.patch(
  "/interests/:interestId",
  asyncHandler(async (req, res) => {
    const interestId = parseId(req.params.interestId, "interestId");
    const payload = updateInterestSchema.parse(req.body);
    res.status(200).json({ item: await updateInterest(interestId, payload) });
  })
);
