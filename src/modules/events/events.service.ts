import { randomUUID } from "node:crypto";
import { EventStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import {
  assertActiveCommunityMember,
  assertActiveCommunityModerator
} from "../communities/communities.service.js";
import { createConfirmedPayment } from "../payments/payments.service.js";

type EventRecurrenceFrequency = "none" | "weekly" | "monthly_nth";

export type EventRecurrenceInput = {
  frequency?: EventRecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: Date | null;
  weekday?: number | null;
  weekOfMonth?: number | null;
};

export type CreateCommunityEventInput = {
  title: string;
  description: string;
  eventType: string;
  startsAt: Date;
  endsAt?: Date | null;
  timezone?: string;
  locationName?: string | null;
  address?: string | null;
  directions?: string | null;
  mapPlaceId?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  cityId?: number | null;
  capacity?: number | null;
  entryFeeUsd?: string | number | null;
  recurrence?: EventRecurrenceInput | null;
};

const attendeeSelect = {
  id: true,
  eventId: true,
  userId: true,
  paymentId: true,
  status: true,
  rsvpAt: true,
  cancelledAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      mobileNumber: true,
      profilePhotoUrl: true
    }
  },
  payment: {
    select: {
      id: true,
      amount: true,
      amountUsd: true,
      currency: true,
      status: true,
      gateway: true
    }
  }
} satisfies Prisma.EventAttendeeSelect;

const eventInclude = {
  creator: {
    select: {
      id: true,
      fullName: true,
      mobileNumber: true,
      profilePhotoUrl: true
    }
  },
  city: {
    select: {
      id: true,
      name: true
    }
  },
  _count: {
    select: {
      attendees: {
        where: {
          status: "going"
        }
      }
    }
  }
} satisfies Prisma.EventInclude;

const eventIncludeForUser = (userId: number) =>
  ({
    ...eventInclude,
    attendees: {
      where: { userId },
      select: attendeeSelect
    }
  }) satisfies Prisma.EventInclude;

type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}> & {
  attendees?: EventAttendeeWithRelations[];
};

type EventAttendeeWithRelations = Prisma.EventAttendeeGetPayload<{
  select: typeof attendeeSelect;
}>;

const cleanOptionalText = (value?: string | null) => value?.trim() || null;

const serializeMoney = (value: Prisma.Decimal | null | undefined) =>
  value == null ? null : value.toString();

const serializeAttendee = (attendee: EventAttendeeWithRelations) => ({
  id: attendee.id,
  eventId: attendee.eventId,
  userId: attendee.userId,
  paymentId: attendee.paymentId,
  status: attendee.status,
  rsvpAt: attendee.rsvpAt,
  cancelledAt: attendee.cancelledAt,
  user: attendee.user,
  payment: attendee.payment
    ? {
        ...attendee.payment,
        amount: serializeMoney(attendee.payment.amount),
        amountUsd: serializeMoney(attendee.payment.amountUsd)
      }
    : null
});

const serializeEvent = (event: EventWithRelations) => ({
  id: event.id,
  communityId: event.communityId,
  creatorUserId: event.creatorUserId,
  cityId: event.cityId,
  title: event.title,
  description: event.description,
  eventType: event.eventType,
  bannerUrl: event.bannerUrl,
  startsAt: event.startsAt,
  endsAt: event.endsAt,
  timezone: event.timezone,
  locationName: event.locationName,
  address: event.address,
  directions: event.directions,
  mapPlaceId: event.mapPlaceId,
  latitude: event.latitude?.toString() ?? null,
  longitude: event.longitude?.toString() ?? null,
  capacity: event.capacity,
  entryFeeUsd: event.entryFeeUsd.toString(),
  recurringSeriesId: event.recurringSeriesId,
  recurrenceRule: event.recurrenceRule,
  recurrenceLabel: event.recurrenceLabel,
  recurrenceIndex: event.recurrenceIndex,
  status: event.status,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
  creator: event.creator,
  city: event.city,
  myRsvp: event.attendees?.[0] ? serializeAttendee(event.attendees[0]) : null,
  _count: event._count
});

const assertValidEventCity = async (cityId?: number | null) => {
  if (!cityId) return null;

  const city = await prisma.city.findFirst({
    where: {
      id: cityId,
      status: true
    },
    select: { id: true }
  });

  if (!city) {
    throw new HttpError(400, "Selected event city is invalid.", "INVALID_EVENT_CITY");
  }

  return city.id;
};

const parseEntryFee = (value?: string | number | null) => {
  if (value == null || value === "") return new Prisma.Decimal("0.00");
  const fee = new Prisma.Decimal(value);

  if (fee.isNegative()) {
    throw new HttpError(400, "Entry fee cannot be negative.", "INVALID_EVENT_ENTRY_FEE");
  }

  return fee.toDecimalPlaces(2);
};

const parseCoordinate = (value?: string | number | null) => {
  if (value == null || value === "") return null;
  return new Prisma.Decimal(value).toDecimalPlaces(7);
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

const nthWeekdayOfMonth = (
  seed: Date,
  monthOffset: number,
  weekday: number,
  weekOfMonth: number
) => {
  const targetMonth = addMonths(
    new Date(Date.UTC(seed.getUTCFullYear(), seed.getUTCMonth(), 1)),
    monthOffset
  );
  const firstOfMonth = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), 1));
  const dayOffset = (weekday - firstOfMonth.getUTCDay() + 7) % 7;
  const day = 1 + dayOffset + (weekOfMonth - 1) * 7;
  const occurrence = new Date(
    Date.UTC(
      targetMonth.getUTCFullYear(),
      targetMonth.getUTCMonth(),
      day,
      seed.getUTCHours(),
      seed.getUTCMinutes(),
      seed.getUTCSeconds(),
      seed.getUTCMilliseconds()
    )
  );

  return occurrence.getUTCMonth() === targetMonth.getUTCMonth() ? occurrence : null;
};

const weekdayName = (date: Date) =>
  new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(date);

const ordinalName = (value: number) => {
  if (value === 1) return "first";
  if (value === 2) return "second";
  if (value === 3) return "third";
  if (value === 4) return "fourth";
  return "fifth";
};

const nextWeeklyDate = (seed: Date, weekday: number) => {
  const delta = (weekday - seed.getUTCDay() + 7) % 7;
  return new Date(seed.getTime() + delta * 24 * 60 * 60 * 1000);
};

const buildRecurrence = (input: CreateCommunityEventInput) => {
  const recurrence = input.recurrence;
  const frequency = recurrence?.frequency ?? "none";
  if (frequency === "none") {
    return {
      occurrences: [{ startsAt: input.startsAt, endsAt: input.endsAt ?? null }],
      seriesId: null,
      rule: null,
      label: null
    };
  }

  const interval = Math.max(1, Math.min(12, recurrence?.interval ?? 1));
  const count = Math.max(2, Math.min(52, recurrence?.count ?? 12));
  const weekday = Math.max(0, Math.min(6, recurrence?.weekday ?? input.startsAt.getUTCDay()));
  const weekOfMonth = Math.max(
    1,
    Math.min(5, recurrence?.weekOfMonth ?? Math.ceil(input.startsAt.getUTCDate() / 7))
  );
  const durationMs = input.endsAt ? input.endsAt.getTime() - input.startsAt.getTime() : null;
  const occurrences: Array<{ startsAt: Date; endsAt: Date | null }> = [];
  const until = recurrence?.until ?? null;
  let monthlyOffset = 0;

  for (let index = 0; index < count; index += 1) {
    let startsAt: Date | null = null;

    if (frequency === "weekly") {
      const first = nextWeeklyDate(input.startsAt, weekday);
      startsAt = new Date(first.getTime() + index * interval * 7 * 24 * 60 * 60 * 1000);
    } else {
      while (!startsAt) {
        const candidate = nthWeekdayOfMonth(
          input.startsAt,
          monthlyOffset * interval,
          weekday,
          weekOfMonth
        );
        monthlyOffset += 1;

        if (candidate && candidate.getUTCDay() === weekday && candidate >= input.startsAt) {
          startsAt = candidate;
        }
      }
    }

    if (!startsAt) continue;
    if (until && startsAt > until) break;

    occurrences.push({
      startsAt,
      endsAt: durationMs == null ? null : new Date(startsAt.getTime() + durationMs)
    });
  }

  if (occurrences.length === 0) {
    throw new HttpError(400, "Recurring schedule did not produce any event dates.", "INVALID_RECURRENCE");
  }

  const label =
    frequency === "weekly"
      ? `Every ${interval > 1 ? `${interval} weeks on ` : ""}${weekdayName(nextWeeklyDate(input.startsAt, weekday))}`
      : `Every ${interval > 1 ? `${interval} months on the ` : ""}${ordinalName(weekOfMonth)} ${weekdayName(
          nextWeeklyDate(input.startsAt, weekday)
        )}`;
  const rule =
    frequency === "weekly"
      ? `FREQ=WEEKLY;INTERVAL=${interval};COUNT=${occurrences.length}`
      : `FREQ=MONTHLY;BYDAY=${weekday};BYSETPOS=${weekOfMonth};INTERVAL=${interval};COUNT=${occurrences.length}`;

  return {
    occurrences,
    seriesId: randomUUID(),
    rule,
    label
  };
};

const findPublishedEvent = async (
  communityId: number,
  eventId: number,
  client: Prisma.TransactionClient | typeof prisma = prisma
) => {
  const event = await client.event.findFirst({
    where: {
      id: eventId,
      communityId,
      status: EventStatus.PUBLISHED
    },
    select: {
      id: true,
      communityId: true,
      capacity: true,
      entryFeeUsd: true
    }
  });

  if (!event) {
    throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
  }

  return event;
};

export const listCommunityEvents = async (communityId: number, userId: number) => {
  await assertActiveCommunityMember(communityId, userId);

  const events = await prisma.event.findMany({
    where: {
      communityId,
      status: EventStatus.PUBLISHED
    },
    include: eventIncludeForUser(userId),
    orderBy: {
      startsAt: "asc"
    }
  });

  return events.map(serializeEvent);
};

export const createCommunityEvent = async (
  communityId: number,
  userId: number,
  input: CreateCommunityEventInput
) => {
  await assertActiveCommunityModerator(communityId, userId);

  if (input.endsAt && input.endsAt <= input.startsAt) {
    throw new HttpError(400, "Event end time must be after the start time.", "INVALID_EVENT_TIME");
  }

  const cityId = await assertValidEventCity(input.cityId);
  const entryFeeUsd = parseEntryFee(input.entryFeeUsd);
  const recurrence = buildRecurrence(input);
  const latitude = parseCoordinate(input.latitude);
  const longitude = parseCoordinate(input.longitude);

  const events = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const [index, occurrence] of recurrence.occurrences.entries()) {
      created.push(
        await tx.event.create({
          data: {
            communityId,
            creatorUserId: userId,
            cityId,
            title: input.title.trim(),
            description: input.description.trim(),
            eventType: input.eventType.trim(),
            startsAt: occurrence.startsAt,
            endsAt: occurrence.endsAt,
            timezone: input.timezone?.trim() || "UTC",
            locationName: cleanOptionalText(input.locationName),
            address: cleanOptionalText(input.address),
            directions: cleanOptionalText(input.directions),
            mapPlaceId: cleanOptionalText(input.mapPlaceId),
            latitude,
            longitude,
            capacity: input.capacity ?? null,
            entryFeeUsd,
            recurringSeriesId: recurrence.seriesId,
            recurrenceRule: recurrence.rule,
            recurrenceLabel: recurrence.label,
            recurrenceIndex: recurrence.seriesId ? index + 1 : null,
            status: EventStatus.PUBLISHED
          },
          include: eventIncludeForUser(userId)
        })
      );
    }

    return created;
  });

  return serializeEvent(events[0]);
};

export const rsvpCommunityEvent = async (communityId: number, eventId: number, userId: number) => {
  await assertActiveCommunityMember(communityId, userId);
  const now = new Date();

  const event = await prisma.$transaction(async (tx) => {
    const currentEvent = await findPublishedEvent(communityId, eventId, tx);
    const existing = await tx.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      },
      select: {
        id: true,
        status: true,
        paymentId: true
      }
    });

    if (existing?.status === "going") {
      return tx.event.findUniqueOrThrow({
        where: { id: eventId },
        include: eventIncludeForUser(userId)
      });
    }

    const goingCount = await tx.eventAttendee.count({
      where: {
        eventId,
        status: "going"
      }
    });

    if (currentEvent.capacity && goingCount >= currentEvent.capacity) {
      throw new HttpError(409, "This event is already full.", "EVENT_FULL");
    }

    let paymentId = existing?.paymentId ?? null;
    if (currentEvent.entryFeeUsd.gt(0) && !paymentId) {
      const payment = await createConfirmedPayment(tx, {
          userId,
          communityId,
          amount: currentEvent.entryFeeUsd,
          currency: "USD",
          metadata: {
            type: "EVENT_RSVP",
            eventId
          }
      });
      paymentId = payment.id;
    }

    await tx.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      },
      update: {
        status: "going",
        rsvpAt: now,
        cancelledAt: null,
        paymentId
      },
      create: {
        eventId,
        userId,
        status: "going",
        rsvpAt: now,
        paymentId
      }
    });

    return tx.event.findUniqueOrThrow({
      where: { id: eventId },
      include: eventIncludeForUser(userId)
    });
  });

  return serializeEvent(event);
};

export const cancelCommunityEventRsvp = async (
  communityId: number,
  eventId: number,
  userId: number
) => {
  await assertActiveCommunityMember(communityId, userId);
  await findPublishedEvent(communityId, eventId);

  await prisma.eventAttendee.updateMany({
    where: {
      eventId,
      userId,
      status: "going"
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date()
    }
  });

  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: eventIncludeForUser(userId)
  });

  return serializeEvent(event);
};

export const listCommunityEventAttendees = async (
  communityId: number,
  eventId: number,
  userId: number
) => {
  await assertActiveCommunityMember(communityId, userId);
  await findPublishedEvent(communityId, eventId);

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId },
    select: attendeeSelect,
    orderBy: { rsvpAt: "desc" }
  });

  return attendees.map(serializeAttendee);
};

export const cancelCommunityEventAttendee = async (
  communityId: number,
  eventId: number,
  attendeeId: number,
  moderatorUserId: number
) => {
  await assertActiveCommunityModerator(communityId, moderatorUserId);
  await findPublishedEvent(communityId, eventId);

  const existing = await prisma.eventAttendee.findFirst({
    where: { id: attendeeId, eventId },
    select: { id: true }
  });

  if (!existing) {
    throw new HttpError(404, "Event attendee not found.", "EVENT_ATTENDEE_NOT_FOUND");
  }

  const attendee = await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: {
      status: "cancelled",
      cancelledAt: new Date()
    },
    select: attendeeSelect
  });

  return serializeAttendee(attendee);
};
