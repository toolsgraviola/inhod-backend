import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { getPlatformSettings } from "./admin-settings.service.js";

const serializeMoney = (value: Prisma.Decimal | null | undefined) =>
  value == null ? "0.00" : value.toString();

const roundMoney = (value: Prisma.Decimal) => value.toDecimalPlaces(2).toString();

export const getAdminAccounting = async () => {
  const settings = await getPlatformSettings();
  const platformShare = new Prisma.Decimal(settings.platformSharePercent).div(100);
  const founderShare = new Prisma.Decimal(settings.founderSharePercent).div(100);

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          mobileNumber: true
        }
      },
      community: {
        select: {
          id: true,
          name: true,
          founder: {
            select: {
              id: true,
              fullName: true,
              mobileNumber: true
            }
          }
        }
      },
      eventAttendances: {
        include: {
          event: {
            select: {
              id: true,
              title: true
            }
          }
        },
        take: 1
      }
    }
  });

  const succeeded = payments.filter((payment) => payment.status === PaymentStatus.SUCCEEDED);
  const grossUsd = succeeded.reduce(
    (sum, payment) => sum.add(payment.amountUsd ?? payment.amount),
    new Prisma.Decimal(0)
  );
  const platformUsd = grossUsd.mul(platformShare);
  const founderUsd = grossUsd.mul(founderShare);

  return {
    summary: {
      grossUsd: roundMoney(grossUsd),
      platformShareUsd: roundMoney(platformUsd),
      founderShareUsd: roundMoney(founderUsd),
      succeededPayments: succeeded.length,
      pendingPayments: payments.filter((payment) => payment.status === PaymentStatus.PENDING).length,
      platformSharePercent: settings.platformSharePercent,
      founderSharePercent: settings.founderSharePercent
    },
    items: payments.map((payment) => {
      const amountUsd = payment.amountUsd ?? payment.amount;
      return {
        id: payment.id,
        user: payment.user,
        community: payment.community,
        event: payment.eventAttendances[0]?.event ?? null,
        gateway: payment.gateway,
        gatewayPaymentId: payment.gatewayPaymentId,
        amount: serializeMoney(payment.amount),
        amountUsd: serializeMoney(payment.amountUsd),
        currency: payment.currency,
        status: payment.status,
        metadata: payment.metadata,
        platformShareUsd: roundMoney(amountUsd.mul(platformShare)),
        founderShareUsd: roundMoney(amountUsd.mul(founderShare)),
        createdAt: payment.createdAt
      };
    })
  };
};
