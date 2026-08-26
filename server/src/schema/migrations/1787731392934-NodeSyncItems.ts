import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "sync_node_item" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "nodeUserId" uuid NOT NULL,
  "direction" character varying NOT NULL,
  "assetId" uuid NOT NULL,
  "status" character varying NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "lastError" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sync_node_item_nodeUserId_fkey" FOREIGN KEY ("nodeUserId") REFERENCES "sync_node_user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_item_nodeUserId_direction_assetId_uq" UNIQUE ("nodeUserId", "direction", "assetId"),
  CONSTRAINT "sync_node_item_pkey" PRIMARY KEY ("id")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "sync_node_item";`.execute(db);
}
