import { ClickHouse } from "clickhouse";
import { Migrator, Migration } from "./migrator";

export class ClickHouseMigrator extends Migrator<ClickHouse> {
  constructor(
    readonly opts: {
      migrations: Migration<ClickHouse>[];
      db: ClickHouse;
    }
  ) {
    super(opts);
  }

  async init() {}

  async runMigrations() {
    await this.init();
  }
}
