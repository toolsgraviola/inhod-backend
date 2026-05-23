import { Router } from "express";
import { z } from "zod";
import { authenticateUser, type AuthenticatedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getUserProfileById, updateUserProfile } from "./users.service.js";

export const usersRouter = Router();

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  nationalityCountryId: z.number().int().positive().nullable().optional(),
  nationalityStateId: z.number().int().positive().nullable().optional(),
  nationalityCityId: z.number().int().positive().nullable().optional(),
  currentCountryId: z.number().int().positive().nullable().optional(),
  stateId: z.number().int().positive().nullable().optional(),
  cityId: z.number().int().positive().nullable().optional(),
  profession: z.string().trim().min(2).max(120).nullable().optional(),
  profilePhotoUrl: z.string().url().nullable().optional(),
  languages: z.array(z.string().trim().min(2).max(120)).max(12).optional(),
  interestIds: z.array(z.number().int().positive()).max(30).optional()
});

usersRouter.get(
  "/me",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      user: req.user,
      profile: await getUserProfileById(req.user!.id)
    });
  })
);

usersRouter.patch(
  "/me/profile",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = updateProfileSchema.parse(req.body);
    res.status(200).json({
      profile: await updateUserProfile(req.user!.id, payload)
    });
  })
);
