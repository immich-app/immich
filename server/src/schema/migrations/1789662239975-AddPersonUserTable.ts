import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "person_user_role_enum" AS ENUM ('read','write','admin');`.execute(db);
  await sql`CREATE TABLE "person_user" (
  "personGroupId" uuid NOT NULL,
  "sharedById" uuid NOT NULL,
  "sharedWithId" uuid NOT NULL,
  "role" person_user_role_enum NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "person_user_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_sharedById_personGroupId_fkey" FOREIGN KEY ("sharedById", "personGroupId") REFERENCES "person" ("ownerId", "personGroupId") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_pkey" PRIMARY KEY ("personGroupId", "sharedById", "sharedWithId")
);`.execute(db);
  await sql`CREATE INDEX "person_user_sharedById_personGroupId_idx" ON "person_user" ("sharedById", "personGroupId");`.execute(db);
  await sql`CREATE INDEX "person_user_sharedWithId_idx" ON "person_user" ("sharedWithId");`.execute(db);
  await sql`CREATE INDEX "person_user_updateId_idx" ON "person_user" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_user_updatedAt"
  BEFORE UPDATE ON "person_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_user_updatedAt', '{"type":"trigger","name":"person_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"person_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "person_user";`.execute(db);
  await sql`DROP TYPE "person_user_role_enum";`.execute(db);
  await sql`DROP TRIGGER "person_user_updatedAt" ON "person_user";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_user_updatedAt';`.execute(db);
}
