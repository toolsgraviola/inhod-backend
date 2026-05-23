import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export type CreateLanguageInput = {
  code: string;
  name: string;
  nativeName?: string | null;
  status?: boolean;
};

export type UpdateLanguageInput = Partial<CreateLanguageInput>;

const normalizeLanguageCode = (code: string) => code.trim().toLowerCase();
const normalizeOptionalText = (value?: string | null) => value?.trim() || null;

const handleLanguageWriteError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A language with this code or name already exists.", "LANGUAGE_CONFLICT");
    }
  }

  throw error;
};

export const listAdminLanguages = async () => {
  const [languages, usageCounts] = await Promise.all([
    prisma.language.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        nativeName: true,
        status: true
      }
    }),
    prisma.userLanguage.groupBy({
      by: ["languageCode"],
      _count: {
        _all: true
      }
    })
  ]);

  const countByCode = new Map(
    usageCounts.map((item) => [item.languageCode, item._count._all])
  );

  return languages.map((language) => ({
    ...language,
    userCount: countByCode.get(language.code) ?? 0
  }));
};

export const createLanguage = async (input: CreateLanguageInput) => {
  try {
    return await prisma.language.create({
      data: {
        code: normalizeLanguageCode(input.code),
        name: input.name.trim(),
        nativeName: normalizeOptionalText(input.nativeName),
        status: input.status ?? true
      }
    });
  } catch (error) {
    handleLanguageWriteError(error);
  }
};

export const updateLanguage = async (languageId: number, input: UpdateLanguageInput) => {
  const existing = await prisma.language.findUnique({
    where: { id: languageId }
  });

  if (!existing) {
    throw new HttpError(404, "Language not found.", "LANGUAGE_NOT_FOUND");
  }

  const nextCode = input.code ? normalizeLanguageCode(input.code) : undefined;

  try {
    return await prisma.$transaction(async (tx) => {
      const language = await tx.language.update({
        where: { id: languageId },
        data: {
          code: nextCode,
          name: input.name?.trim(),
          nativeName:
            input.nativeName === undefined ? undefined : normalizeOptionalText(input.nativeName),
          status: input.status
        }
      });

      if (nextCode && nextCode !== existing.code) {
        await tx.userLanguage.updateMany({
          where: { languageCode: existing.code },
          data: { languageCode: nextCode }
        });
      }

      return language;
    });
  } catch (error) {
    handleLanguageWriteError(error);
  }
};
