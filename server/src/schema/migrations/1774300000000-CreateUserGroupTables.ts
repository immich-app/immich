import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "user_group" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" text NOT NULL,
      "color" character varying(20),
      "origin" character varying NOT NULL DEFAULT 'manual',
      "createdById" uuid NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "user_group_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "user_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "user_group_createdById_idx" ON "user_group" ("createdById")`.execute(db);
  await sql`CREATE INDEX "user_group_createId_idx" ON "user_group" ("createId")`.execute(db);
  await sql`CREATE INDEX "user_group_updateId_idx" ON "user_group" ("updateId")`.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "user_group_updatedAt"
      BEFORE UPDATE ON "user_group"
      FOR EACH ROW
      EXECUTE FUNCTION updated_at();
  `.execute(db);

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_user_group_updatedAt', '{"type":"trigger","name":"user_group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"user_group_updatedAt\\"\\n  BEFORE UPDATE ON \\"user_group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);

  await sql`
    CREATE TABLE "user_group_member" (
      "groupId" uuid NOT NULL,
      "userId" uuid NOT NULL,
      "addedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "user_group_member_pkey" PRIMARY KEY ("groupId", "userId"),
      CONSTRAINT "user_group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_group" ("id") ON DELETE CASCADE,
      CONSTRAINT "user_group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "user_group_member_userId_idx" ON "user_group_member" ("userId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "user_group_member"`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_user_group_updatedAt'`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "user_group_updatedAt" ON "user_group"`.execute(db);
  await sql`DROP TABLE IF EXISTS "user_group"`.execute(db);
}
