import { Router } from "express";
import { authenticateUser, type AuthenticatedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { saveUploadedMedia, uploadMediaSchema } from "./uploads.service.js";

export const uploadsRouter = Router();

uploadsRouter.post(
  "/media",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = uploadMediaSchema.parse(req.body);
    const publicBaseUrl = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      item: await saveUploadedMedia(payload, publicBaseUrl)
    });
  })
);
