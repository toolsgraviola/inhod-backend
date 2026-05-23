import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { uploadsRoot } from "./modules/uploads/uploads.service.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true
    })
  );
  app.use(express.json({ limit: "50mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => {
    res.status(200).json({
      service: "inhod-backend",
      status: "ok",
      docs: "/api/health"
    });
  });

  app.use("/uploads", express.static(uploadsRoot));
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
