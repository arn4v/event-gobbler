import { z } from "zod";
import { createIsoDateSchema } from "./common";
import { defaultPropertiesSchema } from "./default_properties";
import { payloadTypeSchema } from "./payload_type";

export const eventSchema = z.object({
  type: payloadTypeSchema,
  event: z.string(),
  // This should only be used to override the existing identified user.
  // Note: SHOULD NOT be exposed to the client SDK.
  user_id: z.union([z.string(), z.number()]).optional().nullable(),
  captured_at: createIsoDateSchema("captured_at"),
  properties: defaultPropertiesSchema.and(z.lazy(() => z.record(z.any()))),
});

export type EventPayloadSchema = z.infer<typeof eventSchema>;
