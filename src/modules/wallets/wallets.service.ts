import { Prisma, WalletTransactionType } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

const serializeWallet = (wallet: {
  currency: string;
  pendingBalance: Prisma.Decimal;
  availableBalance: Prisma.Decimal;
  withdrawnBalance: Prisma.Decimal;
}) => ({
  currency: wallet.currency,
  pendingBalance: wallet.pendingBalance.toString(),
  availableBalance: wallet.availableBalance.toString(),
  withdrawnBalance: wallet.withdrawnBalance.toString()
});

const serializeTransaction = (transaction: {
  id: number;
  transactionType: WalletTransactionType;
  amount: Prisma.Decimal;
  currency: string;
  status: string;
  createdAt: Date;
}) => ({
  id: transaction.id,
  transactionType: transaction.transactionType,
  amount: transaction.amount.toString(),
  currency: transaction.currency,
  status: transaction.status,
  createdAt: transaction.createdAt
});

export const getOrCreateWallet = async (userId: number) => {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, currency: "USD" }
  });

  return serializeWallet(wallet);
};

export const listWalletTransactions = async (userId: number) => {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, currency: "USD" }
  });

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      transactionType: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true
    }
  });

  return transactions.map(serializeTransaction);
};

export const addWalletFunds = async (
  userId: number,
  input: { amount: string | number; currency?: string }
) => {
  const amount = new Prisma.Decimal(input.amount);
  const currency = input.currency?.trim().toUpperCase() || "USD";

  const wallet = await prisma.$transaction(async (tx) => {
    const current = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, currency }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: current.id,
        transactionType: WalletTransactionType.CREDIT,
        amount,
        currency,
        status: "completed",
        availableAt: new Date()
      }
    });

    return tx.wallet.update({
      where: { id: current.id },
      data: {
        currency,
        availableBalance: {
          increment: amount
        }
      }
    });
  });

  return serializeWallet(wallet);
};
