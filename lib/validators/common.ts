import { z } from "zod";
import isISODate from "@arn4v/is-iso-date";

export const createIsoDateSchema = (field_name: string) =>
  z.string().refine(isISODate, {
    message: `${field_name} must be an ISO 8601 string.`,
  });
