import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "invitation" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" character varying NOT NULL,
    "token" character varying NOT NULL,
    "invitedById" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "expiresAt" timestamp with time zone NOT NULL,
    "acceptedAt" timestamp with time zone
  );`.execute(db);
  await sql`ALTER TABLE "invitation" ADD CONSTRAINT "PK_invitation" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "invitation" ADD CONSTRAINT "FK_invitation_user" FOREIGN KEY ("invitedById") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_invitation_token" ON "invitation" ("token");`.execute(db);
  await sql`CREATE INDEX "IDX_invitation_email" ON "invitation" ("email");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_invitation_token";`.execute(db);
  await sql`DROP INDEX "IDX_invitation_email";`.execute(db);
  await sql`ALTER TABLE "invitation" DROP CONSTRAINT "FK_invitation_user";`.execute(db);
  await sql`ALTER TABLE "invitation" DROP CONSTRAINT "PK_invitation";`.execute(db);
  await sql`DROP TABLE "invitation";`.execute(db);
}
