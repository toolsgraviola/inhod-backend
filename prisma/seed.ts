import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { City as LocationCity, State as LocationState } from "country-state-city";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const countries = [
  {
    name: "United Arab Emirates",
    isoCode: "AE",
    currencyCode: "AED",
    phoneCode: "+971"
  },
  {
    name: "India",
    isoCode: "IN",
    currencyCode: "INR",
    phoneCode: "+91"
  },
  {
    name: "United States",
    isoCode: "US",
    currencyCode: "USD",
    phoneCode: "+1"
  },
  {
    name: "Canada",
    isoCode: "CA",
    currencyCode: "CAD",
    phoneCode: "+1"
  }
];

const categories = [
  "General",
  "Business",
  "Students",
  "IT Professionals",
  "Restaurants",
  "Jobs",
  "Real Estate",
  "Families",
  "Events",
  "Sports",
  "Religious",
  "Startups"
];

const interests = [
  "Networking",
  "Business",
  "Technology",
  "Food",
  "Sports",
  "Culture",
  "Jobs",
  "Real Estate",
  "Startups",
  "Students",
  "Family",
  "Travel"
];

const countryLanguageCodes: Record<string, string[]> = {
  AE: ["ar", "en", "hi", "ur", "ml", "ta", "bn", "fil", "fa", "ps"],
  IN: [
    "as",
    "bn",
    "brx",
    "doi",
    "en",
    "gu",
    "hi",
    "kn",
    "ks",
    "kok",
    "mai",
    "ml",
    "mni",
    "mr",
    "ne",
    "or",
    "pa",
    "sa",
    "sat",
    "sd",
    "ta",
    "te",
    "ur"
  ],
  US: [
    "ar",
    "bn",
    "de",
    "en",
    "es",
    "fa",
    "fil",
    "fr",
    "gu",
    "hi",
    "ht",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "ta",
    "te",
    "ur",
    "vi",
    "yue",
    "zh"
  ],
  CA: [
    "ar",
    "bla",
    "cr",
    "den",
    "de",
    "en",
    "es",
    "fil",
    "fr",
    "hi",
    "it",
    "iu",
    "mic",
    "oj",
    "pa",
    "pt",
    "ta",
    "uk",
    "ur",
    "yue",
    "zh"
  ]
};

const languageCatalogue = [
  { code: "ar", name: "Arabic" },
  { code: "as", name: "Assamese" },
  { code: "bla", name: "Blackfoot" },
  { code: "bn", name: "Bengali" },
  { code: "brx", name: "Bodo" },
  { code: "cr", name: "Cree" },
  { code: "de", name: "German" },
  { code: "den", name: "Dene" },
  { code: "doi", name: "Dogri" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fa", name: "Persian" },
  { code: "fil", name: "Filipino" },
  { code: "fr", name: "French" },
  { code: "gu", name: "Gujarati" },
  { code: "hi", name: "Hindi" },
  { code: "ht", name: "Haitian Creole" },
  { code: "it", name: "Italian" },
  { code: "iu", name: "Inuktitut" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "ko", name: "Korean" },
  { code: "kok", name: "Konkani" },
  { code: "ks", name: "Kashmiri" },
  { code: "mai", name: "Maithili" },
  { code: "mic", name: "Mi'kmaq" },
  { code: "ml", name: "Malayalam" },
  { code: "mni", name: "Manipuri" },
  { code: "mr", name: "Marathi" },
  { code: "ne", name: "Nepali" },
  { code: "oj", name: "Ojibwe" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "pl", name: "Polish" },
  { code: "ps", name: "Pashto" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "sa", name: "Sanskrit" },
  { code: "sat", name: "Santali" },
  { code: "sd", name: "Sindhi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "yue", name: "Chinese (Cantonese)" },
  { code: "zh", name: "Chinese (Mandarin)" }
];

const exchangeRates = [
  { targetCurrency: "USD", rate: "1.00000000" },
  { targetCurrency: "AED", rate: "3.67250000" },
  { targetCurrency: "INR", rate: "83.00000000" },
  { targetCurrency: "CAD", rate: "1.37000000" }
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const stateNameOverrides: Record<string, string> = {
  "AE:AZ": "Abu Dhabi",
  "AE:AJ": "Ajman",
  "AE:FU": "Fujairah",
  "AE:RK": "Ras Al Khaimah",
  "AE:SH": "Sharjah",
  "AE:UQ": "Umm Al Quwain"
};

const additionalCityNames: Record<string, string[]> = {
  "AE:AZ": ["Abu Dhabi"]
};

const getStateDisplayName = (countryIsoCode: string, stateCode: string, stateName: string) =>
  stateNameOverrides[`${countryIsoCode}:${stateCode}`] ?? stateName;

const uniqueCityNames = (cityNames: string[]) => {
  const seen = new Set<string>();

  return cityNames
    .map((name) => name.trim())
    .filter((name) => {
      if (!name) return false;

      const normalized = name.toLocaleLowerCase();
      if (seen.has(normalized)) return false;

      seen.add(normalized);
      return true;
    })
    .sort((left, right) => left.localeCompare(right));
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

async function seedLocations() {
  let seededStates = 0;
  let seededCities = 0;

  for (const countryInput of countries) {
    const country = await prisma.country.upsert({
      where: { isoCode: countryInput.isoCode },
      update: {
        name: countryInput.name,
        currencyCode: countryInput.currencyCode,
        phoneCode: countryInput.phoneCode,
        status: true
      },
      create: {
        name: countryInput.name,
        isoCode: countryInput.isoCode,
        currencyCode: countryInput.currencyCode,
        phoneCode: countryInput.phoneCode,
        status: true
      }
    });

    await prisma.pricingRule.upsert({
      where: {
        countryId_status: {
          countryId: country.id,
          status: "active"
        }
      },
      update: {
        baseFeeUsd: "1.00",
        platformPercent: "50.00",
        founderPercent: "50.00"
      },
      create: {
        countryId: country.id,
        baseFeeUsd: "1.00",
        platformPercent: "50.00",
        founderPercent: "50.00",
        status: "active"
      }
    });

    const states = LocationState.getStatesOfCountry(countryInput.isoCode);

    if (states.length === 0) {
      throw new Error(`No states found for ${countryInput.name} (${countryInput.isoCode})`);
    }

    for (const stateInput of states) {
      const stateName = getStateDisplayName(
        countryInput.isoCode,
        stateInput.isoCode,
        stateInput.name
      );

      const state = await prisma.state.upsert({
        where: {
          countryId_name: {
            countryId: country.id,
            name: stateName
          }
        },
        update: {
          code: stateInput.isoCode,
          status: true
        },
        create: {
          countryId: country.id,
          name: stateName,
          code: stateInput.isoCode,
          status: true
        }
      });
      seededStates += 1;

      const locationKey = `${countryInput.isoCode}:${stateInput.isoCode}`;
      const cityNames = uniqueCityNames([
        ...LocationCity.getCitiesOfState(countryInput.isoCode, stateInput.isoCode).map(
          (city) => city.name
        ),
        ...(additionalCityNames[locationKey] ?? [])
      ]);

      for (const cityNameChunk of chunk(cityNames, 500)) {
        await prisma.city.createMany({
          data: cityNameChunk.map((cityName) => ({
            countryId: country.id,
            stateId: state.id,
            name: cityName,
            status: true
          })),
          skipDuplicates: true
        });

        await prisma.city.updateMany({
          where: {
            countryId: country.id,
            stateId: state.id,
            name: {
              in: cityNameChunk
            }
          },
          data: {
            status: true
          }
        });
      }

      seededCities += cityNames.length;
    }
  }

  console.log(`Seeded location catalogue: ${seededStates} states, ${seededCities} cities.`);
}

async function seedCategories() {
  for (const name of categories) {
    await prisma.communityCategory.upsert({
      where: { slug: slugify(name) },
      update: { name, status: true },
      create: { name, slug: slugify(name), status: true }
    });
  }
}

async function seedInterests() {
  for (const name of interests) {
    await prisma.interest.upsert({
      where: { name },
      update: { status: true },
      create: { name, status: true }
    });
  }
}

async function seedLanguages() {
  const availableCountryCodes = new Set(countries.map((country) => country.isoCode));
  const languageCodes = new Set(
    Object.entries(countryLanguageCodes)
      .filter(([countryCode]) => availableCountryCodes.has(countryCode))
      .flatMap(([, codes]) => codes)
  );
  const languages = languageCatalogue
    .filter((language) => languageCodes.has(language.code))
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        status: true
      },
      create: {
        code: language.code,
        name: language.name,
        status: true
      }
    });
  }

  console.log(`Seeded language catalogue: ${languages.length} languages.`);
}

async function seedExchangeRates() {
  const effectiveAt = new Date("2026-05-21T00:00:00.000Z");

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: "USD",
        targetCurrency: rate.targetCurrency,
        rate: rate.rate,
        provider: "seed",
        effectiveAt
      }
    });
  }
}

async function seedAdminUser() {
  const username = (process.env.ADMIN_SEED_USERNAME ?? "admin").trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? "Admin@12345";
  const name = process.env.ADMIN_SEED_NAME ?? "INHOD Admin";

  const existing = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        name,
        role: "super_admin",
        status: true
      }
    });
    return;
  }

  await prisma.adminUser.create({
    data: {
      username,
      name,
      passwordHash: hashPassword(password),
      role: "super_admin",
      status: true
    }
  });
}

async function main() {
  await seedAdminUser();
  await seedLocations();
  await seedCategories();
  await seedInterests();
  await seedLanguages();

  const existingSeedRates = await prisma.exchangeRate.count({
    where: { provider: "seed" }
  });

  if (existingSeedRates === 0) {
    await seedExchangeRates();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("INHOD seed data inserted.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
