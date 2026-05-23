import { Router } from "express";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";

export const paymentsRouter = Router();

paymentsRouter.post("/webhooks/:gateway", (req, res) => {
  sendScaffoldResponse(res, "payments", "webhook-received", { gateway: req.params.gateway });
});

paymentsRouter.post("/:paymentId/confirm", (req, res) => {
  sendScaffoldResponse(res, "payments", "confirm", { paymentId: req.params.paymentId });
});

