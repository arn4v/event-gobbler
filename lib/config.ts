import { z } from "zod";
import fs from "fs";
import path from "path";

const dbConfig = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
  dbName: z.string(),
  migrationTableName: z.string(),
});

export const dbConfigSchema = z.object({
  clickhouse: dbConfig.extend({
    eventTableName: z.string(),
  }),
  postgres: dbConfig.extend({
    usersTableName: z.string(),
  }),
});

const serviceConfigSchema = z.object({
  port: z.number(),
  db: dbConfigSchema,
});

export type ServiceConfig = z.infer<typeof serviceConfigSchema>;
export type DbConfig = z.infer<typeof dbConfigSchema>;

export function readConfig() {
  const configPath = process.env.EG_CONFIG_PATH
    ? process.env.EG_CONFIG_PATH
    : path.resolve(process.cwd(), "./config.json");

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return fs.readFileSync(configPath, "utf8");
  } else {
    throw new Error(`Config file not found at ${configPath}`);
  }
}

export function readAndValidateConfig() {
  let config: string;
  try {
    config = readConfig();
  } catch (e) {
    console.error(`Config file not found at ${e.message}`);
    process.exit(1);
  }

  config = JSON.parse(config);

  const result = serviceConfigSchema.safeParse(config);
  if (!result.success) {
    console.error("Config validation failed", result.error);
    process.exit(1);
  } else {
    return result.data;
  }
}
