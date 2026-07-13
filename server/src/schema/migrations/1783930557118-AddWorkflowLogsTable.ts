import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "workflow" ADD "logging" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`CREATE TABLE "workflow_log" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "workflowId" uuid NOT NULL,
  "error" boolean NOT NULL,
  "halted" boolean NOT NULL,
  "workflowStepId" uuid,
  "triggerDataId" uuid,
  CONSTRAINT "workflow_log_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_log_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "workflow_step" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "workflow_log_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_log_workflowId_idx" ON "workflow_log" ("workflowId");`.execute(db);
  await sql`CREATE INDEX "workflow_log_workflowStepId_idx" ON "workflow_log" ("workflowStepId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "workflow" DROP COLUMN "logging";`.execute(db);
  await sql`DROP TABLE "workflow_log";`.execute(db);
}
