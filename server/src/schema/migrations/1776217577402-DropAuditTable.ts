import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "audit";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "audit" (
  "id" serial NOT NULL,
  "entityType" character varying NOT NULL,
  "entityId" uuid NOT NULL,
  "action" character varying NOT NULL,
  "ownerId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "audit_ownerId_createdAt_idx" ON "audit" ("ownerId", "createdAt");`.execute(db);
}
