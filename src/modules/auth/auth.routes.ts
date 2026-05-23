import { Router } from "express";
import { z } from "zod";
import { verifyFirebaseIdToken } from "../../integrations/firebase/admin.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ensureAuthenticatedUser, requireFirebasePhoneNumber } from "./auth.service.js";

const firebaseLoginSchema = z.object({
  idToken: z.string().min(1)
});

export const authRouter = Router();

authRouter.post(
  "/firebase-login",
  asyncHandler(async (req, res) => {
    const { idToken } = firebaseLoginSchema.parse(req.body);
    const decoded = await verifyFirebaseIdToken(idToken);
    const phoneNumber = requireFirebasePhoneNumber(decoded.phone_number);
    const user = await ensureAuthenticatedUser({
      firebaseUid: decoded.uid,
      mobileNumber: phoneNumber,
      fullName: typeof decoded.name === "string" ? decoded.name : null
    });

    res.status(200).json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        phoneNumber: user.mobileNumber,
        profileComplete: Boolean(user.profileCompletedAt)
      },
      session: {
        provider: "firebase",
        tokenType: "Bearer"
      }
    });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.status(204).send();
});
