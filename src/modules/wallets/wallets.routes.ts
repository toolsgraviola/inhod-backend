import { Router } from "express";
import { z } from "zod";
import { authenticateUser, type AuthenticatedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";
import {
  addWalletFunds,
  getOrCreateWallet,
  listWalletTransactions
} from "./wallets.service.js";

export const walletsRouter = Router();

const addFundsSchema = z.object({
  amount: z.union([z.string(), z.number()]).refine((value) => Number(value) > 0, {
    message: "Amount must be greater than zero."
  }),
  currency: z.string().trim().length(3).optional()
});

walletsRouter.get(
  "/me/wallet",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(200).json({ item: await getOrCreateWallet(req.user!.id) });
  })
);

walletsRouter.get(
  "/me/wallet/transactions",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(200).json({ items: await listWalletTransactions(req.user!.id) });
  })
);

walletsRouter.post(
  "/me/wallet/add-funds",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = addFundsSchema.parse(req.body);
    res.status(201).json({ item: await addWalletFunds(req.user!.id, payload) });
  })
);

walletsRouter.post("/me/payout-requests", authenticateUser, (_req, res) => {
  sendScaffoldResponse(res, "wallets", "request-payout");
});
