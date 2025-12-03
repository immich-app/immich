import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "workflow_filter_filterId_idx";`.execute(db);
  await sql`DROP INDEX "workflow_action_actionId_idx";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" DROP CONSTRAINT "workflow_filter_filterId_fkey";`.execute(db);
  await sql`ALTER TABLE "workflow_action" DROP CONSTRAINT "workflow_action_actionId_fkey";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" RENAME COLUMN "filterId" TO "pluginFilterId";`.execute(db);
  await sql`ALTER TABLE "workflow_action" RENAME COLUMN "actionId" TO "pluginActionId";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" ADD CONSTRAINT "workflow_filter_pluginFilterId_fkey" FOREIGN KEY ("pluginFilterId") REFERENCES "plugin_filter" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "workflow_action" ADD CONSTRAINT "workflow_action_pluginActionId_fkey" FOREIGN KEY ("pluginActionId") REFERENCES "plugin_action" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "workflow_filter_pluginFilterId_idx" ON "workflow_filter" ("pluginFilterId");`.execute(db);
  await sql`CREATE INDEX "workflow_action_pluginActionId_idx" ON "workflow_action" ("pluginActionId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "workflow_filter_pluginFilterId_idx";`.execute(db);
  await sql`DROP INDEX "workflow_action_pluginActionId_idx";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" DROP CONSTRAINT "workflow_filter_pluginFilterId_fkey";`.execute(db);
  await sql`ALTER TABLE "workflow_action" DROP CONSTRAINT "workflow_action_pluginActionId_fkey";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" RENAME COLUMN "pluginFilterId" TO "filterId";`.execute(db);
  await sql`ALTER TABLE "workflow_action" RENAME COLUMN "pluginActionId" TO "actionId";`.execute(db);
  await sql`ALTER TABLE "workflow_filter" ADD CONSTRAINT "workflow_filter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "plugin_filter" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "workflow_action" ADD CONSTRAINT "workflow_action_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "plugin_action" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "workflow_filter_filterId_idx" ON "workflow_filter" ("filterId");`.execute(db);
  await sql`CREATE INDEX "workflow_action_actionId_idx" ON "workflow_action" ("actionId");`.execute(db);
}
