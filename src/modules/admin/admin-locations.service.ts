import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export type CreateCountryInput = {
  name: string;
  isoCode: string;
  currencyCode: string;
  phoneCode?: string | null;
  status?: boolean;
};

export type UpdateCountryInput = Partial<CreateCountryInput>;

export type CreateStateInput = {
  countryId: number;
  name: string;
  code?: string | null;
  status?: boolean;
};

export type UpdateStateInput = Partial<CreateStateInput>;

export type CreateCityInput = {
  countryId: number;
  stateId?: number | null;
  name: string;
  status?: boolean;
};

export type UpdateCityInput = Partial<CreateCityInput>;

const normalizeCode = (value?: string | null) => value?.trim().toUpperCase() || null;

const handleLocationWriteError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A location with these values already exists.", "LOCATION_CONFLICT");
    }

    if (error.code === "P2003") {
      throw new HttpError(400, "The selected parent location does not exist.", "INVALID_PARENT_LOCATION");
    }
  }

  throw error;
};

export const listAdminCountries = async () => {
  return prisma.country.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      isoCode: true,
      currencyCode: true,
      phoneCode: true,
      status: true,
      _count: {
        select: {
          states: true,
          cities: true,
          communities: true
        }
      }
    }
  });
};

export const createCountry = async (input: CreateCountryInput) => {
  try {
    return await prisma.country.create({
      data: {
        name: input.name.trim(),
        isoCode: input.isoCode.trim().toUpperCase(),
        currencyCode: input.currencyCode.trim().toUpperCase(),
        phoneCode: normalizeCode(input.phoneCode),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};

export const updateCountry = async (countryId: number, input: UpdateCountryInput) => {
  try {
    return await prisma.country.update({
      where: { id: countryId },
      data: {
        name: input.name?.trim(),
        isoCode: input.isoCode ? input.isoCode.trim().toUpperCase() : undefined,
        currencyCode: input.currencyCode ? input.currencyCode.trim().toUpperCase() : undefined,
        phoneCode: input.phoneCode === undefined ? undefined : normalizeCode(input.phoneCode),
        status: input.status
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};

export const listAdminStates = async (countryId?: number) => {
  return prisma.state.findMany({
    where: countryId ? { countryId } : undefined,
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      countryId: true,
      name: true,
      code: true,
      status: true,
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true
        }
      },
      _count: {
        select: {
          cities: true,
          communities: true
        }
      }
    }
  });
};

export const createState = async (input: CreateStateInput) => {
  try {
    return await prisma.state.create({
      data: {
        countryId: input.countryId,
        name: input.name.trim(),
        code: normalizeCode(input.code),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};

export const updateState = async (stateId: number, input: UpdateStateInput) => {
  try {
    return await prisma.state.update({
      where: { id: stateId },
      data: {
        countryId: input.countryId,
        name: input.name?.trim(),
        code: input.code === undefined ? undefined : normalizeCode(input.code),
        status: input.status
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};

export const listAdminCities = async (filters: { countryId?: number; stateId?: number }) => {
  return prisma.city.findMany({
    where: {
      countryId: filters.countryId,
      stateId: filters.stateId
    },
    orderBy: [{ country: { name: "asc" } }, { state: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      countryId: true,
      stateId: true,
      name: true,
      status: true,
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
      _count: {
        select: {
          communities: true,
          currentUsers: true
        }
      }
    }
  }).then((cities) =>
    cities.map((city) => ({
      ...city,
      _count: {
        communities: city._count.communities,
        users: city._count.currentUsers
      }
    }))
  );
};

export const createCity = async (input: CreateCityInput) => {
  try {
    return await prisma.city.create({
      data: {
        countryId: input.countryId,
        stateId: input.stateId ?? null,
        name: input.name.trim(),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};

export const updateCity = async (cityId: number, input: UpdateCityInput) => {
  try {
    return await prisma.city.update({
      where: { id: cityId },
      data: {
        countryId: input.countryId,
        stateId: input.stateId,
        name: input.name?.trim(),
        status: input.status
      }
    });
  } catch (error) {
    handleLocationWriteError(error);
  }
};
