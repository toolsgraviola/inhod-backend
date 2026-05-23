import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { getApiIntegrationSettings } from "../admin/admin-settings.service.js";

type PaymentClient = Prisma.TransactionClient | typeof prisma;

export const resolvePaymentGateway = async () => {
  const settings = await getApiIntegrationSettings();
  return settings.stripeConfigured ? "stripe" : "dev";
};

export const createConfirmedPayment = async (
  client: PaymentClient,
  input: {
    userId: number;
    communityId?: number | null;
    amount: Prisma.Decimal;
    currency?: string;
    metadata?: Prisma.InputJsonValue;
  }
) => {
  const gateway = await resolvePaymentGateway();
  const timestamp = Date.now();

  return client.payment.create({
    data: {
      userId: input.userId,
      communityId: input.communityId ?? null,
      gateway,
      gatewayPaymentId: `${gateway}-${input.userId}-${timestamp}`,
      amount: input.amount,
      amountUsd: input.currency && input.currency !== "USD" ? null : input.amount,
      currency: input.currency ?? "USD",
      status: PaymentStatus.SUCCEEDED,
      metadata: input.metadata
    },
    select: { id: true }
  });
};
