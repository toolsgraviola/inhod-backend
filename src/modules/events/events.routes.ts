import { Router } from "express";

export const eventsRouter = Router();

eventsRouter.use((_req, res) => {
  res.status(410).json({
    error: {
      code: "COMMUNITY_SCOPED_EVENTS",
      message: "Events are scoped to communities. Use /communities/:communityId/events."
    }
  });
});
