export interface Migration<Db> {
  name: string;
  migrate(db: Db): Promise<void>;
}

export abstract class Migrator<Db> {
  protected constructor(
    protected readonly opts: { migrations: Migration<Db>[]; db: Db }
  ) {}

  abstract init(): Promise<void>;

  abstract runMigrations(): Promise<void>;
}
