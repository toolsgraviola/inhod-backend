import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getApiIntegrationSettings,
  getPlatformSettings
} from "../admin/admin-settings.service.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/platform",
  asyncHandler(async (_req, res) => {
    const settings = await getPlatformSettings();
    res.status(200).json({
      settings: {
        baseJoinFeeUsd: settings.baseJoinFeeUsd,
        platformSharePercent: settings.platformSharePercent,
        founderSharePercent: settings.founderSharePercent,
        rejoinPolicy: settings.rejoinPolicy,
        rejoinFreeDays: settings.rejoinFreeDays,
        communityCreateUpfrontFeeUsd: settings.communityCreateUpfrontFeeUsd,
        communityCreateBarterSharePercent: settings.communityCreateBarterSharePercent,
        communityCreateBarterMemberLimit: settings.communityCreateBarterMemberLimit,
        updatedAt: settings.updatedAt
      }
    });
  })
);

settingsRouter.get(
  "/auth",
  asyncHandler(async (_req, res) => {
    const settings = await getApiIntegrationSettings();
    const firebaseEnabled = settings.firebaseAuthConfigured;

    res.status(200).json({
      firebaseEnabled,
      testLoginEnabled: !firebaseEnabled,
      firebase: firebaseEnabled
        ? {
            apiKey: settings.firebaseApiKey,
            authDomain: settings.firebaseAuthDomain || null,
            projectId: settings.firebaseProjectId,
            storageBucket: settings.firebaseStorageBucket || null,
            messagingSenderId: settings.firebaseMessagingSenderId,
            appId: settings.firebaseAppId
          }
        : null
    });
  })
);
