import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import { assertUserCanAccess } from "../users/users.service.js";

export type EnsureAuthenticatedUserInput = {
  firebaseUid: string;
  mobileNumber?: string | null;
  fullName?: string | null;
};

export const ensureAuthenticatedUser = async ({
  firebaseUid,
  mobileNumber,
  fullName
}: EnsureAuthenticatedUserInput) => {
  const normalizedMobileNumber = mobileNumber || `firebase:${firebaseUid}`;

  let user = await prisma.user.findUnique({
    where: { firebaseUid }
  });

  if (!user) {
    const existingByMobile = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobileNumber }
    });

    user = existingByMobile
      ? await prisma.user.update({
          where: { id: existingByMobile.id },
          data: { firebaseUid }
        })
      : await prisma.user.create({
          data: {
            firebaseUid,
            mobileNumber: normalizedMobileNumber,
            fullName: fullName || null
          }
        });
  }

  assertUserCanAccess(user.status);

  return user;
};

export const requireFirebasePhoneNumber = (phoneNumber?: string | null) => {
  if (!phoneNumber) {
    throw new HttpError(400, "Firebase token does not include a verified phone number.", "PHONE_REQUIRED");
  }

  return phoneNumber;
};

