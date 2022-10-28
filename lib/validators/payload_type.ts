import { z } from "zod";

export const payloadTypeSchema = z.enum(["$track", "$identify"]);

export type PayloadTypeSchema = z.infer<typeof payloadTypeSchema>;
