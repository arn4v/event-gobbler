import { Pool } from "pg";
import sql from "sql-tag";
import { unsafeCoerce } from "../helpers";
import { Migrator, Migration } from "./migrator";

export class PgMigrator extends Migrator<Pool> {
  constructor(
    readonly opts: {
      migrations: Migration<Pool>[];
      db: Pool;
      dbName: string;
      migrationTableName: string;
      usersTableName: string;
    }
  ) {
    super(opts);
  }

  async init() {
    await this.opts.db.query(
      sql`CREATE DATABASE IF NOT EXISTS ${this.opts.dbName};`
    );

    await this.opts.db.query(sql`
      CREATE TABLE IF NOT EXISTS ${this.opts.dbName}.${this.opts.migrationTableName} (
        name VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }

  async runMigrations() {
    await this.init();

    const migrationsRun = unsafeCoerce<
      {
        name: string;
        created_at: Date;
      }[]
    >(
      await this.opts.db.query(sql`
      SELECT name FROM ${this.opts.dbName}.${this.opts.migrationTableName};
    `)
    );

    const migrationsToRun = this.opts.migrations.filter(
      (migration) => !migrationsRun.some((m) => m.name === migration.name)
    );

    for (const { name, migrate } of migrationsToRun) {
      await migrate(this.opts.db);
      await this.opts.db.query(
        sql`INSERT INTO ${this.opts.dbName}.${this.opts.migrationTableName} (name) VALUES (${name});`
      );
    }
  }
}
