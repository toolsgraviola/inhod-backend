import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export type CreateCommunityCategoryInput = {
  name: string;
  slug?: string | null;
  status?: boolean;
};

export type UpdateCommunityCategoryInput = Partial<CreateCommunityCategoryInput>;

export type CreateInterestInput = {
  name: string;
  status?: boolean;
};

export type UpdateInterestInput = Partial<CreateInterestInput>;

const cleanOptionalText = (value?: string | null) => value?.trim() || null;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCategorySlug = (slug: string | null | undefined, name: string) => {
  const normalized = slugify(cleanOptionalText(slug) ?? name);
  return normalized || `category-${Date.now()}`;
};

const handleCatalogWriteError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new HttpError(409, "A catalogue item with these values already exists.", "CATALOG_CONFLICT");
  }

  throw error;
};

export const listAdminCommunityCategories = async () => {
  return prisma.communityCategory.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      _count: {
        select: {
          communities: true
        }
      }
    }
  });
};

export const createCommunityCategory = async (input: CreateCommunityCategoryInput) => {
  try {
    return await prisma.communityCategory.create({
      data: {
        name: input.name.trim(),
        slug: normalizeCategorySlug(input.slug, input.name),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleCatalogWriteError(error);
  }
};

export const updateCommunityCategory = async (
  categoryId: number,
  input: UpdateCommunityCategoryInput
) => {
  const existing = await prisma.communityCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true }
  });

  if (!existing) {
    throw new HttpError(404, "Community category not found.", "COMMUNITY_CATEGORY_NOT_FOUND");
  }

  try {
    return await prisma.communityCategory.update({
      where: { id: categoryId },
      data: {
        name: input.name?.trim(),
        slug:
          input.slug === undefined
            ? undefined
            : normalizeCategorySlug(input.slug, input.name ?? existing.name),
        status: input.status
      }
    });
  } catch (error) {
    handleCatalogWriteError(error);
  }
};

export const listAdminInterests = async () => {
  const [interests, usageCounts] = await Promise.all([
    prisma.interest.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        status: true
      }
    }),
    prisma.userInterest.groupBy({
      by: ["interestId"],
      _count: {
        _all: true
      }
    })
  ]);

  const countByInterestId = new Map(
    usageCounts.map((item) => [item.interestId, item._count._all])
  );

  return interests.map((interest) => ({
    ...interest,
    userCount: countByInterestId.get(interest.id) ?? 0
  }));
};

export const createInterest = async (input: CreateInterestInput) => {
  try {
    return await prisma.interest.create({
      data: {
        name: input.name.trim(),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleCatalogWriteError(error);
  }
};

export const updateInterest = async (interestId: number, input: UpdateInterestInput) => {
  const existing = await prisma.interest.findUnique({
    where: { id: interestId },
    select: { id: true }
  });

  if (!existing) {
    throw new HttpError(404, "Interest not found.", "INTEREST_NOT_FOUND");
  }

  try {
    return await prisma.interest.update({
      where: { id: interestId },
      data: {
        name: input.name?.trim(),
        status: input.status
      }
    });
  } catch (error) {
    handleCatalogWriteError(error);
  }
};
