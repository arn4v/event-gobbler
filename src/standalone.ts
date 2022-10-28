import { ClickHouse } from "clickhouse";
import fastify from "fastify";
import { Pool } from "pg";
import { dbConfigSchema, readAndValidateConfig } from "../lib/config";
import { ClickHouseMigrator } from "../lib/migrations/clickhouse";
import { PgMigrator } from "../lib/migrations/postgres";
import { pluginAsync } from "../lib/service";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EG_CONFIG_PATH?: string;
      PORT: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const main = async () => {
  const config = readAndValidateConfig();
  const port =
    config.port ?? (process.env.PORT ? Number(process.env.PORT) : 3000);
  const app = fastify({
    logger: envToLogger[process.env.NODE_ENV],
  });

  const pgPool = new Pool({
    ...config.db.postgres,
  });

  const chInstance = new ClickHouse({
    url: `http://${config.db.clickhouse.host}:${config.db.clickhouse.port}`,
    basicAuth: {
      username: config.db.clickhouse.user,
      password: config.db.clickhouse.password,
    },
  });

  const pgMigrator = new PgMigrator({
    migrations: [
      {
        name: "initial",
        migrate: async (db) => {
          await db.query(
            `CREATE TABLE IF NOT EXISTS ${config.db.postgres.usersTableName} (
              id UUID PRIMARY KEY,
              email TEXT NOT NULL,
              password TEXT NOT NULL,
              created_at TIMESTAMP NOT NULL,
              updated_at TIMESTAMP NOT NULL
            );`
          );
        },
      },
    ],
    db: pgPool,
    dbName: config.db.postgres.dbName,
    migrationTableName: config.db.postgres.migrationTableName,
    usersTableName: config.db.postgres.usersTableName,
  });

  const chMigrator = new ClickHouseMigrator({
    db: chInstance,
    migrations: [
      {
        name: "initial",
        migrate: async (db) => {
          await db
            .query(
              `CREATE TABLE IF NOT EXISTS main.events (
                id UUID, 
                user_id UUID, 
                tenant_id UUID, 
                distinct_id VARCHAR, 
                name VARCHAR, 
                name_normalized VARCHAR, 
                capture_timestamp DateTime64(3, 'UTC'), 
                received_timestamp DateTime64(3, 'UTC'), 
                ip String, 
                country String, 
                payload String, 
                created_at DateTime64(3, 'UTC'), 
                ) Engine = MergeTree() 
              ORDER BY 
                (tenant_id, id)`
            )
            .toPromise();
        },
      },
    ],
  });

  await pgMigrator.runMigrations();
  await chMigrator.runMigrations();

  app.register(pluginAsync, {
    track: async (payload) => {},
    identify: async (payload) => {},
  });

  app.listen(port, () => {
    console.log(`Event Gobbler listening on port ${port}`);
  });
};

main();
