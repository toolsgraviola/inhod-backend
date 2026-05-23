import { Prisma } from "@prisma/client";
import type { UserStatus } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const locationSelect = {
  id: true,
  name: true
};

const countrySelect = {
  ...locationSelect,
  isoCode: true,
  currencyCode: true,
  phoneCode: true
};

const userProfileInclude = {
  nationalityCountry: {
    select: countrySelect
  },
  nationalityState: {
    select: {
      ...locationSelect,
      code: true
    }
  },
  nationalityCity: {
    select: locationSelect
  },
  currentCountry: {
    select: countrySelect
  },
  state: {
    select: {
      ...locationSelect,
      code: true
    }
  },
  city: {
    select: locationSelect
  },
  languages: {
    select: {
      languageCode: true
    },
    orderBy: {
      languageCode: "asc"
    }
  },
  interests: {
    include: {
      interest: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      interest: {
        name: "asc"
      }
    }
  }
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof userProfileInclude;
}>;

export type UpdateUserProfileInput = {
  fullName?: string;
  nationalityCountryId?: number | null;
  nationalityStateId?: number | null;
  nationalityCityId?: number | null;
  currentCountryId?: number | null;
  stateId?: number | null;
  cityId?: number | null;
  profession?: string | null;
  profilePhotoUrl?: string | null;
  languages?: string[];
  interestIds?: number[];
};

const normalizeLanguageInput = (language: string) => language.trim();

const resolveActiveLanguageCodes = async (languages: string[]) => {
  const uniqueLanguages = [
    ...new Set(languages.map(normalizeLanguageInput).filter(Boolean))
  ];

  if (uniqueLanguages.length === 0) {
    return [];
  }

  const normalizedCodes = uniqueLanguages.map((language) => language.toLowerCase());
  const activeLanguages = await prisma.language.findMany({
    where: {
      status: true,
      OR: [
        {
          code: {
            in: normalizedCodes
          }
        },
        {
          name: {
            in: uniqueLanguages
          }
        }
      ]
    },
    select: {
      code: true,
      name: true
    }
  });

  const codeByInput = new Map<string, string>();

  for (const language of activeLanguages) {
    codeByInput.set(language.code.toLowerCase(), language.code);
    codeByInput.set(language.name.toLowerCase(), language.code);
  }

  const resolvedCodes = uniqueLanguages.map((language) =>
    codeByInput.get(language.toLowerCase())
  );

  if (resolvedCodes.some((languageCode) => !languageCode)) {
    throw new HttpError(400, "One or more selected languages are invalid.", "INVALID_LANGUAGES");
  }

  return [...new Set(resolvedCodes as string[])];
};

const isProfileComplete = (user: UserWithProfile) => {
  return Boolean(
    user.fullName &&
      user.mobileNumber &&
      user.nationalityCountryId &&
      user.nationalityStateId &&
      user.nationalityCityId &&
      user.currentCountryId &&
      user.stateId &&
      user.cityId &&
      user.profession &&
      user.languages.length > 0 &&
      user.interests.length > 0
  );
};

export const serializeUserProfile = async (user: UserWithProfile) => {
  const languageCodes = user.languages.map((language) => language.languageCode);
  const languageDetails = await prisma.language.findMany({
    where: {
      code: {
        in: languageCodes
      }
    },
    select: {
      id: true,
      code: true,
      name: true,
      nativeName: true
    }
  });
  const languageByCode = new Map(languageDetails.map((language) => [language.code, language]));

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
    nationalityCountryId: user.nationalityCountryId,
    nationalityStateId: user.nationalityStateId,
    nationalityCityId: user.nationalityCityId,
    currentCountryId: user.currentCountryId,
    stateId: user.stateId,
    cityId: user.cityId,
    profession: user.profession,
    profilePhotoUrl: user.profilePhotoUrl,
    status: user.status,
    profileCompletedAt: user.profileCompletedAt,
    profileComplete: isProfileComplete(user),
    nationalityCountry: user.nationalityCountry,
    nationalityState: user.nationalityState,
    nationalityCity: user.nationalityCity,
    currentCountry: user.currentCountry,
    state: user.state,
    city: user.city,
    languages: languageCodes,
    languageDetails: languageCodes
      .map((languageCode) => languageByCode.get(languageCode))
      .filter(Boolean),
    interests: user.interests.map(({ interest }) => interest),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const getUserProfileById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userProfileInclude
  });

  if (!user) {
    throw new HttpError(404, "User not found.", "USER_NOT_FOUND");
  }

  return serializeUserProfile(user);
};

export const updateUserProfile = async (userId: number, input: UpdateUserProfileInput) => {
  const uniqueInterestIds = [...new Set(input.interestIds ?? [])];
  const resolvedLanguageCodes = input.languages
    ? await resolveActiveLanguageCodes(input.languages)
    : undefined;

  if (input.interestIds) {
    const activeInterestCount = await prisma.interest.count({
      where: {
        id: { in: uniqueInterestIds },
        status: true
      }
    });

    if (activeInterestCount !== uniqueInterestIds.length) {
      throw new HttpError(400, "One or more selected interests are invalid.", "INVALID_INTERESTS");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const userUpdate: Prisma.UserUncheckedUpdateInput = {};

    if (input.fullName !== undefined) userUpdate.fullName = input.fullName;
    if (input.nationalityCountryId !== undefined) {
      userUpdate.nationalityCountryId = input.nationalityCountryId;
    }
    if (input.nationalityStateId !== undefined) userUpdate.nationalityStateId = input.nationalityStateId;
    if (input.nationalityCityId !== undefined) userUpdate.nationalityCityId = input.nationalityCityId;
    if (input.currentCountryId !== undefined) userUpdate.currentCountryId = input.currentCountryId;
    if (input.stateId !== undefined) userUpdate.stateId = input.stateId;
    if (input.cityId !== undefined) userUpdate.cityId = input.cityId;
    if (input.profession !== undefined) userUpdate.profession = input.profession;
    if (input.profilePhotoUrl !== undefined) userUpdate.profilePhotoUrl = input.profilePhotoUrl;

    await tx.user.update({
      where: { id: userId },
      data: userUpdate
    });

    if (input.languages) {
      const languages = resolvedLanguageCodes ?? [];

      await tx.userLanguage.deleteMany({ where: { userId } });

      if (languages.length > 0) {
        await tx.userLanguage.createMany({
          data: languages.map((languageCode) => ({ userId, languageCode })),
          skipDuplicates: true
        });
      }
    }

    if (input.interestIds) {
      await tx.userInterest.deleteMany({ where: { userId } });

      if (uniqueInterestIds.length > 0) {
        await tx.userInterest.createMany({
          data: uniqueInterestIds.map((interestId) => ({ userId, interestId })),
          skipDuplicates: true
        });
      }
    }

    const profile = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: userProfileInclude
    });

    const profileCompletedAt = isProfileComplete(profile)
      ? profile.profileCompletedAt ?? new Date()
      : null;

    return tx.user.update({
      where: { id: userId },
      data: { profileCompletedAt },
      include: userProfileInclude
    });
  });

  return serializeUserProfile(updated);
};

export const assertUserCanAccess = (status: UserStatus) => {
  if (status === "BLOCKED" || status === "SUSPENDED" || status === "DELETED") {
    throw new HttpError(403, "This account is not allowed to access INHOD.", "ACCOUNT_RESTRICTED");
  }
};
