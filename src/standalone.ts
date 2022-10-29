import { ClickHouse } from "clickhouse";
import fastify from "fastify";
import { Pool } from "pg";
import { readAndValidateConfig } from "../lib/config";
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

interface EventRecord {
  id: string;
  user_id: string | null | undefined;
  event: string;
  payload: string;
  event_capture_time: string;
  event_received_time: string;
  created_at: string;
}

interface UserTable {
  id: string;
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
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              properties JSON NOT NULL DEFAULT '{}'
              payload JSON NOT NULL,
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
                id UUID DEFAULT generateUUIDv4(), 
                user_id UUID, 
                event VARCHAR, 
                payload VARCHAR CODEC(ZSTD), 
                event_capture_time DateTime64(3, 'UTC'), 
                event_received_time DateTime64(3, 'UTC'), 
                created_at DateTime64(3, 'UTC'), 
                ) Engine = MergeTree() 
              ORDER BY 
                ( id)`
            )
            .toPromise();
        },
      },
    ],
  });

  await pgMigrator.runMigrations();
  await chMigrator.runMigrations();

  app.register(pluginAsync, {
    track: async (payload) => {
      const toInsert: Omit<EventRecord, "id">[] = payload.map((p) => ({
        user_id:
          typeof p.user_id === "string" || typeof p.user_id === "number"
            ? `${p.user_id}`
            : null,
        event: p.event,
        payload: JSON.stringify(p),
        event_capture_time: p.captured_at,
        event_received_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }));

      await chInstance
        .insert(
          `INSERT INTO ${config.db.clickhouse.dbName}.${config.db.clickhouse.eventTableName} (user_id, event, payload, event_capture_time, event_recieved_time, created_at)`,
          toInsert
        )
        .toPromise();
    },
    identify: async (payload) => {
      await pgPool.query(
        `INSERT INTO ${config.db.postgres.dbName}.${config.db.postgres.usersTableName} (payload, properties, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET payload = $1, properties = $2, updated_at = $4`,
        [
          payload.properties,
          payload,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    },
  });

  app.listen(port, () => {
    console.log(`Event Gobbler listening on port ${port}`);
  });
};

main();
