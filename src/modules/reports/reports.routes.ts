import { Router } from "express";
import { authenticateUser } from "../../middleware/auth.js";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";

export const reportsRouter = Router();

reportsRouter.post("/", authenticateUser, (_req, res) => {
  sendScaffoldResponse(res, "reports", "create");
});

