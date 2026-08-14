import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "workflow_queue" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "workflowId" uuid NOT NULL,
  "data" jsonb NOT NULL,
  CONSTRAINT "workflow_queue_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_queue_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_queue_workflowId_idx" ON "workflow_queue" ("workflowId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "workflow_queue";`.execute(db);
}
