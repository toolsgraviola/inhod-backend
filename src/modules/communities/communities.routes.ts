import { Router } from "express";
import { z } from "zod";
import { CommunityScope, CommunityStatus, CommunityVisibility } from "@prisma/client";
import { authenticateUser, type AuthenticatedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { parseId } from "../../utils/parse-id.js";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";
import {
  cancelCommunityEventAttendee,
  cancelCommunityEventRsvp,
  createCommunityEvent,
  listCommunityEventAttendees,
  listCommunityEvents,
  rsvpCommunityEvent
} from "../events/events.service.js";
import {
  createCommunityPost,
  createCommunityPostComment,
  listCommunityPostComments,
  listCommunityPosts
} from "../posts/posts.service.js";
import {
  addCommunityModerator,
  createCommunityRequest,
  getCommunityById,
  joinCommunity,
  listCommunities,
  listMyCommunities,
  updateCommunity
} from "./communities.service.js";

export const communitiesRouter = Router();

const createCommunitySchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(3000),
  categoryId: z.number().int().positive(),
  countryId: z.number().int().positive(),
  stateId: z.number().int().positive().nullable().optional(),
  cityId: z.number().int().positive().nullable().optional(),
  scope: z.nativeEnum(CommunityScope),
  visibility: z.nativeEnum(CommunityVisibility).optional(),
  rules: z.string().trim().max(3000).nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  joinFeeUsd: z.union([z.string(), z.number()]).nullable().optional(),
  creationMode: z.enum(["upfront", "barter"]).optional()
});

const updateCommunitySchema = createCommunitySchema.omit({ creationMode: true });

const addModeratorSchema = z
  .object({
    userId: z.number().int().positive().optional(),
    mobileNumber: z.string().trim().min(5).max(30).optional()
  })
  .refine((input) => input.userId || input.mobileNumber, {
    message: "Provide a user id or mobile number."
  });

const createPostSchema = z
  .object({
    text: z.string().trim().max(3000).nullable().optional(),
    mediaType: z.enum(["image", "video"]).nullable().optional(),
    mediaUrl: z.string().trim().url().nullable().optional(),
    mediaItems: z
      .array(
        z.object({
          mediaType: z.enum(["image", "video"]),
          mediaUrl: z.string().trim().url()
        })
      )
      .max(10)
      .optional(),
    linkUrl: z.string().trim().url().nullable().optional()
  })
  .refine((input) => input.text || input.mediaUrl || input.mediaItems?.length || input.linkUrl, {
    message: "Add text, media, or a link to publish a post."
  })
  .refine((input) => !input.mediaUrl || input.mediaType, {
    message: "Media type is required when media URL is provided.",
    path: ["mediaType"]
  });

const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(3000),
    eventType: z.string().trim().min(2).max(80),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    locationName: z.string().trim().max(240).nullable().optional(),
    address: z.string().trim().max(1000).nullable().optional(),
    directions: z.string().trim().max(2000).nullable().optional(),
    mapPlaceId: z.string().trim().max(255).nullable().optional(),
    latitude: z.union([z.string(), z.number()]).nullable().optional(),
    longitude: z.union([z.string(), z.number()]).nullable().optional(),
    cityId: z.number().int().positive().nullable().optional(),
    capacity: z.number().int().positive().nullable().optional(),
    entryFeeUsd: z.union([z.string(), z.number()]).nullable().optional(),
    recurrence: z
      .object({
        frequency: z.enum(["none", "weekly", "monthly_nth"]).optional(),
        interval: z.number().int().min(1).max(12).optional(),
        count: z.number().int().min(2).max(52).optional(),
        weekday: z.number().int().min(0).max(6).nullable().optional(),
        weekOfMonth: z.number().int().min(1).max(5).nullable().optional(),
        until: z.coerce.date().nullable().optional()
      })
      .nullable()
      .optional()
  })
  .refine((input) => !input.endsAt || input.endsAt > input.startsAt, {
    message: "Event end time must be after the start time.",
    path: ["endsAt"]
  });

const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(1200)
});

const parseOptionalId = (value: unknown, label: string) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return parseId(String(value), label);
};

communitiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      items: await listCommunities({
        status: CommunityStatus.ACTIVE,
        countryId: parseOptionalId(req.query.countryId, "countryId"),
        stateId: parseOptionalId(req.query.stateId, "stateId"),
        cityId: parseOptionalId(req.query.cityId, "cityId")
      })
    });
  })
);

communitiesRouter.get(
  "/mine",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(200).json({ items: await listMyCommunities(req.user!.id) });
  })
);

communitiesRouter.post(
  "/",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = createCommunitySchema.parse(req.body);
    res.status(201).json({
      item: await createCommunityRequest(req.user!.id, payload)
    });
  })
);

communitiesRouter.get(
  "/:communityId",
  asyncHandler(async (req, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    res.status(200).json({ item: await getCommunityById(communityId) });
  })
);

communitiesRouter.patch(
  "/:communityId",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const payload = updateCommunitySchema.parse(req.body);
    res.status(200).json({
      item: await updateCommunity(communityId, req.user!.id, payload)
    });
  })
);

communitiesRouter.get(
  "/:communityId/feed",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    res.status(200).json({ items: await listCommunityPosts(communityId, req.user!.id) });
  })
);

communitiesRouter.post(
  "/:communityId/feed",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const payload = createPostSchema.parse(req.body);
    res.status(201).json({
      item: await createCommunityPost(communityId, req.user!.id, payload)
    });
  })
);

communitiesRouter.get(
  "/:communityId/feed/:postId/comments",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const postId = parseId(req.params.postId, "postId");
    res.status(200).json({
      items: await listCommunityPostComments(communityId, postId, req.user!.id)
    });
  })
);

communitiesRouter.post(
  "/:communityId/feed/:postId/comments",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const postId = parseId(req.params.postId, "postId");
    const payload = createCommentSchema.parse(req.body);
    res.status(201).json({
      item: await createCommunityPostComment(
        communityId,
        postId,
        req.user!.id,
        payload
      )
    });
  })
);

communitiesRouter.get(
  "/:communityId/events",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    res.status(200).json({ items: await listCommunityEvents(communityId, req.user!.id) });
  })
);

communitiesRouter.post(
  "/:communityId/events",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const payload = createEventSchema.parse(req.body);
    res.status(201).json({
      item: await createCommunityEvent(communityId, req.user!.id, payload)
    });
  })
);

communitiesRouter.post(
  "/:communityId/events/:eventId/rsvp",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const eventId = parseId(req.params.eventId, "eventId");
    res.status(200).json({
      item: await rsvpCommunityEvent(communityId, eventId, req.user!.id)
    });
  })
);

communitiesRouter.delete(
  "/:communityId/events/:eventId/rsvp",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const eventId = parseId(req.params.eventId, "eventId");
    res.status(200).json({
      item: await cancelCommunityEventRsvp(communityId, eventId, req.user!.id)
    });
  })
);

communitiesRouter.get(
  "/:communityId/events/:eventId/attendees",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const eventId = parseId(req.params.eventId, "eventId");
    res.status(200).json({
      items: await listCommunityEventAttendees(communityId, eventId, req.user!.id)
    });
  })
);

communitiesRouter.delete(
  "/:communityId/events/:eventId/attendees/:attendeeId",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const eventId = parseId(req.params.eventId, "eventId");
    const attendeeId = parseId(req.params.attendeeId, "attendeeId");
    res.status(200).json({
      item: await cancelCommunityEventAttendee(communityId, eventId, attendeeId, req.user!.id)
    });
  })
);

communitiesRouter.post(
  "/:communityId/moderators",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    const payload = addModeratorSchema.parse(req.body);
    res.status(201).json({
      item: await addCommunityModerator(communityId, req.user!.id, payload)
    });
  })
);

communitiesRouter.get("/:communityId/join-price", (req, res) => {
  sendScaffoldResponse(res, "communities", "join-price", {
    communityId: req.params.communityId,
    baseFeeUsd: 1,
    currency: "USD"
  });
});

communitiesRouter.post(
  "/:communityId/join-intent",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const communityId = parseId(req.params.communityId, "communityId");
    res.status(200).json({ item: await joinCommunity(communityId, req.user!.id) });
  })
);
