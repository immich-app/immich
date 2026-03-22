import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "shared_space" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" text NOT NULL,
      "description" text,
      "createdById" uuid NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "shared_space_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "shared_space_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "shared_space_createdById_idx" ON "shared_space" ("createdById")`.execute(db);
  await sql`CREATE INDEX "shared_space_createId_idx" ON "shared_space" ("createId")`.execute(db);
  await sql`CREATE INDEX "shared_space_updateId_idx" ON "shared_space" ("updateId")`.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "shared_space_updatedAt"
      BEFORE UPDATE ON "shared_space"
      FOR EACH ROW
      EXECUTE FUNCTION updated_at();
  `.execute(db);

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_shared_space_updatedAt', '{"type":"trigger","name":"shared_space_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"shared_space_updatedAt\\"\\n  BEFORE UPDATE ON \\"shared_space\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);

  await sql`
    CREATE TABLE "shared_space_member" (
      "spaceId" uuid NOT NULL,
      "userId" uuid NOT NULL,
      "role" character varying NOT NULL DEFAULT 'viewer',
      "joinedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "shared_space_member_pkey" PRIMARY KEY ("spaceId", "userId"),
      CONSTRAINT "shared_space_member_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "shared_space" ("id") ON DELETE CASCADE,
      CONSTRAINT "shared_space_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "shared_space_member_userId_idx" ON "shared_space_member" ("userId")`.execute(db);

  await sql`
    CREATE TABLE "shared_space_asset" (
      "spaceId" uuid NOT NULL,
      "assetId" uuid NOT NULL,
      "addedById" uuid,
      "addedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "shared_space_asset_pkey" PRIMARY KEY ("spaceId", "assetId"),
      CONSTRAINT "shared_space_asset_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "shared_space" ("id") ON DELETE CASCADE,
      CONSTRAINT "shared_space_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON DELETE CASCADE,
      CONSTRAINT "shared_space_asset_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user" ("id") ON DELETE SET NULL
    );
  `.execute(db);

  await sql`CREATE INDEX "shared_space_asset_assetId_idx" ON "shared_space_asset" ("assetId")`.execute(db);
  await sql`CREATE INDEX "shared_space_asset_addedById_idx" ON "shared_space_asset" ("addedById")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "shared_space_asset"`.execute(db);
  await sql`DROP TABLE "shared_space_member"`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_shared_space_updatedAt'`.execute(db);
  await sql`DROP TRIGGER "shared_space_updatedAt" ON "shared_space"`.execute(db);
  await sql`DROP TABLE "shared_space"`.execute(db);
}
