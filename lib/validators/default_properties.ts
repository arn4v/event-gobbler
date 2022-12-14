import { z } from "zod";

export const defaultPropertiesSchema = z.object({
  $os: z.string(),
  $browser: z.string(),
  $browser_version: z.string(),
  $url: z.string(),
});

export type DefaultPropertiesSchema = z.infer<typeof defaultPropertiesSchema>;
