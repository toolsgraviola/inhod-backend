import {
  CommunityStatus,
  EventStatus,
  PaymentStatus,
  ReportStatus,
  ReportTargetType,
  UserStatus
} from "@prisma/client";
import { prisma } from "../../database/prisma.js";

export const getAdminOverview = async () => {
  const now = new Date();

  const [
    activeUsers,
    totalUsers,
    activeCommunities,
    pendingCommunities,
    openReports,
    resolvedReports,
    posts,
    upcomingEvents,
    paidJoins,
    revenue,
    reportsByStatus
  ] = await Promise.all([
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count(),
    prisma.community.count({ where: { status: CommunityStatus.ACTIVE } }),
    prisma.community.count({ where: { status: CommunityStatus.PENDING } }),
    prisma.report.count({ where: { status: ReportStatus.OPEN } }),
    prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
    prisma.post.count(),
    prisma.event.count({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: {
          gte: now
        }
      }
    }),
    prisma.payment.count({
      where: {
        status: PaymentStatus.SUCCEEDED,
        communityId: {
          not: null
        }
      }
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCEEDED },
      _sum: { amountUsd: true }
    }),
    prisma.report.groupBy({
      by: ["status"],
      _count: {
        _all: true
      }
    })
  ]);

  return {
    metrics: {
      activeUsers,
      totalUsers,
      revenueUsd: revenue._sum.amountUsd?.toString() ?? "0",
      activeCommunities,
      pendingCommunities,
      openReports
    },
    activity: {
      posts,
      upcomingEvents,
      paidJoins,
      resolvedReports
    },
    reportsByStatus: reportsByStatus.map((item) => ({
      status: item.status,
      count: item._count._all
    }))
  };
};

export const listAdminUsers = async (status?: UserStatus) => {
  const users = await prisma.user.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      mobileNumber: true,
      status: true,
      profileCompletedAt: true,
      createdAt: true,
      nationalityCountry: {
        select: {
          id: true,
          name: true,
          isoCode: true
        }
      },
      nationalityState: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      nationalityCity: {
        select: {
          id: true,
          name: true
        }
      },
      currentCountry: {
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
      _count: {
        select: {
          memberships: true,
          posts: true,
          reports: true
        }
      }
    }
  });

  return users.map((user) => ({
    ...user,
    profileComplete: Boolean(
      user.fullName &&
        user.mobileNumber &&
        user.nationalityCountry &&
        user.nationalityState &&
        user.nationalityCity &&
        user.currentCountry &&
        user.state &&
        user.city
    )
  }));
};

export const listAdminReports = async (filters: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}) => {
  return prisma.report.findMany({
    where: {
      status: filters.status,
      targetType: filters.targetType
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      details: true,
      status: true,
      assignedAdminId: true,
      resolvedAt: true,
      createdAt: true,
      reporter: {
        select: {
          id: true,
          fullName: true,
          mobileNumber: true
        }
      }
    }
  });
};
