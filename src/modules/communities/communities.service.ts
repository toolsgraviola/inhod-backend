import {
  CommunityScope,
  CommunityStatus,
  CommunityVisibility,
  MembershipStatus,
  ModeratorRole,
  Prisma
} from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import { getPlatformSettings } from "../admin/admin-settings.service.js";
import { createConfirmedPayment } from "../payments/payments.service.js";

export type CreateCommunityInput = {
  name: string;
  description: string;
  categoryId: number;
  countryId: number;
  stateId?: number | null;
  cityId?: number | null;
  scope: CommunityScope;
  visibility?: CommunityVisibility;
  rules?: string | null;
  bannerUrl?: string | null;
  joinFeeUsd?: string | number | null;
  creationMode?: "upfront" | "barter";
};

export type UpdateCommunityInput = Omit<CreateCommunityInput, "creationMode">;

export type ListCommunityFilters = {
  status?: CommunityStatus;
  countryId?: number;
  stateId?: number;
  cityId?: number;
};

export type ReviewCommunityInput = {
  status: Extract<CommunityStatus, "ACTIVE" | "REJECTED">;
  adminReviewNote?: string | null;
};

export type AddModeratorInput = {
  userId?: number;
  mobileNumber?: string;
};

const communityInclude = {
  founder: {
    select: {
      id: true,
      fullName: true,
      mobileNumber: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  country: {
    select: {
      id: true,
      name: true,
      isoCode: true
    }
  },
  state: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  city: {
    select: {
      id: true,
      name: true
    }
  },
  moderators: {
    where: {
      status: true
    },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          fullName: true,
          mobileNumber: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  _count: {
    select: {
      members: true,
      moderators: true,
      posts: true,
      events: true
    }
  }
} satisfies Prisma.CommunityInclude;

type CommunityWithRelations = Prisma.CommunityGetPayload<{
  include: typeof communityInclude;
}>;

const cleanOptionalText = (value?: string | null) => value?.trim() || null;

const assertCommunityNameAvailable = async (name: string, ignoreCommunityId?: number) => {
  const existing = await prisma.community.findFirst({
    where: {
      name,
      id: ignoreCommunityId ? { not: ignoreCommunityId } : undefined
    },
    select: { id: true }
  });

  if (existing) {
    throw new HttpError(409, "A community with this name already exists.", "COMMUNITY_NAME_TAKEN");
  }
};

const serializeCommunity = (community: CommunityWithRelations) => ({
  id: community.id,
  name: community.name,
  description: community.description,
  categoryId: community.categoryId,
  countryId: community.countryId,
  stateId: community.stateId,
  cityId: community.cityId,
  scope: community.scope,
  visibility: community.visibility,
  status: community.status,
  rules: community.rules,
  bannerUrl: community.bannerUrl,
  joinFeeUsd: community.joinFeeUsd.toString(),
  creationMode: community.creationMode,
  creationFeeUsd: community.creationFeeUsd?.toString() ?? null,
  barterSharePercent: community.barterSharePercent?.toString() ?? null,
  barterMemberLimit: community.barterMemberLimit,
  adminReviewNote: community.adminReviewNote,
  reviewedAt: community.reviewedAt,
  reviewedByAdminId: community.reviewedByAdminId,
  createdAt: community.createdAt,
  updatedAt: community.updatedAt,
  founder: community.founder,
  category: community.category,
  country: community.country,
  state: community.state,
  city: community.city,
  moderators: community.moderators,
  _count: community._count
});

const getCommunityOrThrow = async (communityId: number) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: communityInclude
  });

  if (!community) {
    throw new HttpError(404, "Community not found.", "COMMUNITY_NOT_FOUND");
  }

  return community;
};

export const assertActiveCommunityMember = async (communityId: number, userId: number) => {
  const membership = await prisma.communityMember.findFirst({
    where: {
      communityId,
      userId,
      status: MembershipStatus.ACTIVE,
      community: {
        status: CommunityStatus.ACTIVE
      }
    },
    select: { id: true }
  });

  if (!membership) {
    throw new HttpError(403, "Join this community to access member content.", "COMMUNITY_MEMBERSHIP_REQUIRED");
  }
};

export const assertActiveCommunityModerator = async (communityId: number, userId: number) => {
  const moderator = await prisma.communityModerator.findFirst({
    where: {
      communityId,
      userId,
      status: true,
      community: {
        status: CommunityStatus.ACTIVE
      }
    },
    select: { id: true }
  });

  if (!moderator) {
    throw new HttpError(403, "Only community moderators can perform this action.", "COMMUNITY_MODERATOR_REQUIRED");
  }
};

const assertCategoryExists = async (categoryId: number) => {
  const category = await prisma.communityCategory.findFirst({
    where: {
      id: categoryId,
      status: true
    },
    select: { id: true }
  });

  if (!category) {
    throw new HttpError(400, "Selected community category is invalid.", "INVALID_CATEGORY");
  }
};

const resolveLocationScope = async (input: CreateCommunityInput) => {
  const country = await prisma.country.findFirst({
    where: {
      id: input.countryId,
      status: true
    },
    select: { id: true }
  });

  if (!country) {
    throw new HttpError(400, "Selected country is invalid.", "INVALID_COUNTRY");
  }

  if (input.scope === CommunityScope.COUNTRY) {
    return {
      countryId: input.countryId,
      stateId: null,
      cityId: null
    };
  }

  if (!input.stateId) {
    throw new HttpError(400, "State or region is required for this community scope.", "STATE_REQUIRED");
  }

  const state = await prisma.state.findFirst({
    where: {
      id: input.stateId,
      countryId: input.countryId,
      status: true
    },
    select: { id: true }
  });

  if (!state) {
    throw new HttpError(400, "Selected state or region is invalid.", "INVALID_STATE");
  }

  if (input.scope === CommunityScope.STATE) {
    return {
      countryId: input.countryId,
      stateId: input.stateId,
      cityId: null
    };
  }

  if (!input.cityId) {
    throw new HttpError(400, "City is required for this community scope.", "CITY_REQUIRED");
  }

  const city = await prisma.city.findFirst({
    where: {
      id: input.cityId,
      countryId: input.countryId,
      stateId: input.stateId,
      status: true
    },
    select: { id: true }
  });

  if (!city) {
    throw new HttpError(400, "Selected city is invalid.", "INVALID_CITY");
  }

  return {
    countryId: input.countryId,
    stateId: input.stateId,
    cityId: input.cityId
  };
};

export const listCommunities = async (filters: ListCommunityFilters = {}) => {
  const communities = await prisma.community.findMany({
    where: {
      status: filters.status,
      countryId: filters.countryId,
      stateId: filters.stateId,
      cityId: filters.cityId
    },
    include: communityInclude,
    orderBy: { createdAt: "desc" }
  });

  return communities.map(serializeCommunity);
};

export const listMyCommunities = async (userId: number) => {
  const communities = await prisma.community.findMany({
    where: {
      OR: [
        { founderUserId: userId },
        {
          members: {
            some: {
              userId,
              status: MembershipStatus.ACTIVE
            }
          }
        },
        {
          moderators: {
            some: {
              userId,
              status: true
            }
          }
        }
      ]
    },
    include: communityInclude,
    orderBy: { createdAt: "desc" }
  });

  return communities.map(serializeCommunity);
};

export const createCommunityRequest = async (userId: number, input: CreateCommunityInput) => {
  const name = input.name.trim();
  await assertCommunityNameAvailable(name);
  await assertCategoryExists(input.categoryId);
  const location = await resolveLocationScope(input);
  const settings = await getPlatformSettings();
  const creationMode = input.creationMode ?? "barter";
  const reviewedAt = new Date();

  const community = await prisma.$transaction(async (tx) => {
    const created = await tx.community.create({
      data: {
        founderUserId: userId,
        categoryId: input.categoryId,
        ...location,
        scope: input.scope,
        name,
        description: input.description.trim(),
        bannerUrl: cleanOptionalText(input.bannerUrl),
        rules: cleanOptionalText(input.rules),
        visibility: input.visibility ?? CommunityVisibility.PUBLIC,
        status: creationMode === "upfront" ? CommunityStatus.ACTIVE : CommunityStatus.PENDING,
        approvalRequired: creationMode !== "upfront",
        joinFeeUsd: input.joinFeeUsd ?? settings.baseJoinFeeUsd,
        creationMode,
        creationFeeUsd: creationMode === "upfront" ? settings.communityCreateUpfrontFeeUsd : null,
        barterSharePercent:
          creationMode === "barter" ? settings.communityCreateBarterSharePercent : null,
        barterMemberLimit: creationMode === "barter" ? settings.communityCreateBarterMemberLimit : null,
        reviewedAt: creationMode === "upfront" ? reviewedAt : null
      }
    });

    if (creationMode === "upfront") {
      await createConfirmedPayment(tx, {
        userId,
        communityId: created.id,
        amount: new Prisma.Decimal(settings.communityCreateUpfrontFeeUsd),
        currency: "USD",
        metadata: {
          type: "COMMUNITY_CREATE_UPFRONT",
          communityId: created.id
        }
      });

      await tx.communityModerator.create({
        data: {
          communityId: created.id,
          userId,
          role: ModeratorRole.FOUNDER,
          status: true
        }
      });

      await tx.communityMember.create({
        data: {
          communityId: created.id,
          userId,
          status: MembershipStatus.ACTIVE,
          joinedAt: reviewedAt
        }
      });
    }

    return tx.community.findUniqueOrThrow({
      where: { id: created.id },
      include: communityInclude
    });
  });

  return serializeCommunity(community);
};

export const getCommunityById = async (communityId: number) => {
  return serializeCommunity(await getCommunityOrThrow(communityId));
};

export const updateCommunity = async (
  communityId: number,
  userId: number,
  input: UpdateCommunityInput
) => {
  await assertActiveCommunityModerator(communityId, userId);
  const name = input.name.trim();
  await assertCommunityNameAvailable(name, communityId);
  await assertCategoryExists(input.categoryId);
  const location = await resolveLocationScope(input);

  const community = await prisma.community.update({
    where: { id: communityId },
    data: {
      categoryId: input.categoryId,
      ...location,
      scope: input.scope,
      name,
      description: input.description.trim(),
      bannerUrl: cleanOptionalText(input.bannerUrl),
      rules: cleanOptionalText(input.rules),
      visibility: input.visibility ?? CommunityVisibility.PUBLIC,
      joinFeeUsd: input.joinFeeUsd ?? undefined
    },
    include: communityInclude
  });

  return serializeCommunity(community);
};

export const joinCommunity = async (communityId: number, userId: number) => {
  const community = await prisma.community.findFirst({
    where: {
      id: communityId,
      status: CommunityStatus.ACTIVE
    },
    select: {
      id: true
    }
  });

  if (!community) {
    throw new HttpError(404, "Active community not found.", "COMMUNITY_NOT_FOUND");
  }

  const existingMembership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId
      }
    },
    select: {
      status: true
    }
  });

  if (existingMembership?.status === MembershipStatus.ACTIVE) {
    return serializeCommunity(await getCommunityOrThrow(communityId));
  }

  if (existingMembership?.status === MembershipStatus.BANNED) {
    throw new HttpError(403, "You cannot rejoin this community.", "COMMUNITY_MEMBERSHIP_BANNED");
  }

  const joinedAt = new Date();

  await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId,
        userId
      }
    },
    update: {
      status: MembershipStatus.ACTIVE,
      joinedAt,
      leftAt: null,
      bannedAt: null
    },
    create: {
      communityId,
      userId,
      status: MembershipStatus.ACTIVE,
      joinedAt
    }
  });

  return serializeCommunity(await getCommunityOrThrow(communityId));
};

export const reviewCommunity = async (
  communityId: number,
  adminId: number,
  input: ReviewCommunityInput
) => {
  const reviewedAt = new Date();

  const community = await prisma.$transaction(async (tx) => {
    const updated = await tx.community.update({
      where: { id: communityId },
      data: {
        status: input.status,
        adminReviewNote: cleanOptionalText(input.adminReviewNote),
        reviewedAt,
        reviewedByAdminId: adminId
      },
      include: communityInclude
    });

    if (input.status === CommunityStatus.ACTIVE) {
      await tx.communityModerator.upsert({
        where: {
          communityId_userId: {
            communityId,
            userId: updated.founderUserId
          }
        },
        update: {
          role: ModeratorRole.FOUNDER,
          status: true
        },
        create: {
          communityId,
          userId: updated.founderUserId,
          role: ModeratorRole.FOUNDER,
          status: true
        }
      });

      await tx.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId,
            userId: updated.founderUserId
          }
        },
        update: {
          status: MembershipStatus.ACTIVE,
          joinedAt: reviewedAt,
          leftAt: null,
          bannedAt: null
        },
        create: {
          communityId,
          userId: updated.founderUserId,
          status: MembershipStatus.ACTIVE,
          joinedAt: reviewedAt
        }
      });
    }

    return tx.community.findUniqueOrThrow({
      where: { id: communityId },
      include: communityInclude
    });
  });

  return serializeCommunity(community);
};

export const addCommunityModerator = async (
  communityId: number,
  founderUserId: number,
  input: AddModeratorInput
) => {
  const founderRole = await prisma.communityModerator.findFirst({
    where: {
      communityId,
      userId: founderUserId,
      role: ModeratorRole.FOUNDER,
      status: true,
      community: {
        status: CommunityStatus.ACTIVE
      }
    }
  });

  if (!founderRole) {
    throw new HttpError(403, "Only the community founder can add moderators.", "FOUNDER_REQUIRED");
  }

  if (!input.userId && !input.mobileNumber) {
    throw new HttpError(400, "Provide a user id or mobile number.", "MODERATOR_TARGET_REQUIRED");
  }

  const user = await prisma.user.findFirst({
    where: input.userId
      ? { id: input.userId }
      : { mobileNumber: input.mobileNumber?.trim() },
    select: {
      id: true,
      fullName: true,
      mobileNumber: true
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found.", "USER_NOT_FOUND");
  }

  const moderator = await prisma.$transaction(async (tx) => {
    const nextModerator = await tx.communityModerator.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: user.id
        }
      },
      update: {
        role: ModeratorRole.MODERATOR,
        status: true,
        addedByUserId: founderUserId
      },
      create: {
        communityId,
        userId: user.id,
        role: ModeratorRole.MODERATOR,
        status: true,
        addedByUserId: founderUserId
      },
      select: {
        id: true,
        role: true,
        status: true,
        user: {
          select: {
            id: true,
            fullName: true,
            mobileNumber: true
          }
        }
      }
    });

    await tx.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: user.id
        }
      },
      update: {
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
        leftAt: null,
        bannedAt: null
      },
      create: {
        communityId,
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date()
      }
    });

    return nextModerator;
  });

  return moderator;
};
