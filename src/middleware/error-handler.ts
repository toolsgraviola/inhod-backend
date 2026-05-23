import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.flatten()
      }
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "Unexpected server error." : error.message,
      stack: isProduction ? undefined : error.stack
    }
  });
};

