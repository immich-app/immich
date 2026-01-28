import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "family_member" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "ownerId" uuid NOT NULL,
    "tagId" uuid NOT NULL,
    "name" character varying NOT NULL,
    "birthdate" date NOT NULL,
    "color" character varying(7),
    "avatarAssetId" uuid,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now()
  );`.execute(db);
  await sql`ALTER TABLE "family_member" ADD CONSTRAINT "PK_family_member" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "family_member" ADD CONSTRAINT "FK_family_member_owner" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "family_member" ADD CONSTRAINT "FK_family_member_tag" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "family_member" ADD CONSTRAINT "FK_family_member_avatar" FOREIGN KEY ("avatarAssetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_family_member_owner_name" ON "family_member" ("ownerId", "name");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_family_member_owner_name";`.execute(db);
  await sql`ALTER TABLE "family_member" DROP CONSTRAINT "FK_family_member_avatar";`.execute(db);
  await sql`ALTER TABLE "family_member" DROP CONSTRAINT "FK_family_member_tag";`.execute(db);
  await sql`ALTER TABLE "family_member" DROP CONSTRAINT "FK_family_member_owner";`.execute(db);
  await sql`ALTER TABLE "family_member" DROP CONSTRAINT "PK_family_member";`.execute(db);
  await sql`DROP TABLE "family_member";`.execute(db);
}
