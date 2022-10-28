import { z } from "zod";
import { defaultPropertiesSchema } from "./default_properties";

export const identifyPayloadSchema = z.object({
  type: z.literal("$identify"),
  user_id: z.union([z.string(), z.number()]),
  properties: defaultPropertiesSchema
    .and(
      z.object({
        $email: z.string(),
        identity: z.union([
          z.object({
            $first_name: z.string(),
            $last_name: z.string(),
          }),
          z.object({
            $name: z.string(),
          }),
        ]),
      })
    )
    .and(z.lazy(() => z.record(z.any()))),
});

export type IdentifyPayloadSchema = z.infer<typeof identifyPayloadSchema>;
