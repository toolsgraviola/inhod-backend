import { prisma } from "../../database/prisma.js";

export const listCountries = async () => {
  return prisma.country.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      isoCode: true,
      currencyCode: true,
      phoneCode: true
    }
  });
};

export const listStatesByCountry = async (countryId: number) => {
  return prisma.state.findMany({
    where: {
      countryId,
      status: true
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      countryId: true,
      name: true,
      code: true
    }
  });
};

export const listCitiesByState = async (stateId: number) => {
  return prisma.city.findMany({
    where: {
      stateId,
      status: true
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      countryId: true,
      stateId: true,
      name: true
    }
  });
};

export const listCitiesByCountry = async (countryId: number) => {
  return prisma.city.findMany({
    where: {
      countryId,
      status: true
    },
    orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      countryId: true,
      stateId: true,
      name: true,
      state: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const listCommunityCategories = async () => {
  return prisma.communityCategory.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
};

export const listInterests = async () => {
  return prisma.interest.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true
    }
  });
};

export const listLanguages = async () => {
  return prisma.language.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nativeName: true
    }
  });
};
