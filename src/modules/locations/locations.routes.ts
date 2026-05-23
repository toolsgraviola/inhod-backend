import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { parseId } from "../../utils/parse-id.js";
import {
  listCitiesByCountry,
  listCitiesByState,
  listCommunityCategories,
  listCountries,
  listInterests,
  listLanguages,
  listStatesByCountry
} from "./locations.service.js";

export const locationsRouter = Router();

locationsRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listCountries() });
  })
);

locationsRouter.get(
  "/countries/:countryId/states",
  asyncHandler(async (req, res) => {
    const countryId = parseId(req.params.countryId, "countryId");
    res.status(200).json({ items: await listStatesByCountry(countryId) });
  })
);

locationsRouter.get(
  "/countries/:countryId/cities",
  asyncHandler(async (req, res) => {
    const countryId = parseId(req.params.countryId, "countryId");
    res.status(200).json({ items: await listCitiesByCountry(countryId) });
  })
);

locationsRouter.get(
  "/states/:stateId/cities",
  asyncHandler(async (req, res) => {
    const stateId = parseId(req.params.stateId, "stateId");
    res.status(200).json({ items: await listCitiesByState(stateId) });
  })
);

locationsRouter.get(
  "/community-categories",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listCommunityCategories() });
  })
);

locationsRouter.get(
  "/interests",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listInterests() });
  })
);

locationsRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listLanguages() });
  })
);
