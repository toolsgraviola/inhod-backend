import type { Response } from "express";

export const sendScaffoldResponse = (
  res: Response,
  moduleName: string,
  action: string,
  payload: Record<string, unknown> = {}
) => {
  res.status(200).json({
    module: moduleName,
    action,
    status: "scaffolded",
    ...payload
  });
};

