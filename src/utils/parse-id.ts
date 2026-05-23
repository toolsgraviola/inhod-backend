import { HttpError } from "./http-error.js";

export const parseId = (value: string | undefined, label: string) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${label} must be a positive integer.`, "INVALID_ID");
  }

  return parsed;
};

