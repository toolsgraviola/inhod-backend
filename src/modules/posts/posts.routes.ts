import { Router } from "express";
import { authenticateUser } from "../../middleware/auth.js";
import { sendScaffoldResponse } from "../../utils/scaffold-response.js";

export const postsRouter = Router();

postsRouter.get("/feed", (_req, res) => {
  sendScaffoldResponse(res, "posts", "feed", { items: [] });
});

postsRouter.post("/", authenticateUser, (_req, res) => {
  sendScaffoldResponse(res, "posts", "create");
});

postsRouter.get("/:postId", (req, res) => {
  sendScaffoldResponse(res, "posts", "detail", { postId: req.params.postId });
});

postsRouter.post("/:postId/like", authenticateUser, (req, res) => {
  sendScaffoldResponse(res, "posts", "like", { postId: req.params.postId });
});

postsRouter.delete("/:postId/like", authenticateUser, (req, res) => {
  sendScaffoldResponse(res, "posts", "unlike", { postId: req.params.postId });
});

postsRouter.post("/:postId/comments", authenticateUser, (req, res) => {
  sendScaffoldResponse(res, "posts", "comment", { postId: req.params.postId });
});

