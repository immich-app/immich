import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "plugin" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying NOT NULL,
  "author" character varying NOT NULL,
  "version" character varying NOT NULL,
  "wasmPath" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "plugin_name_uq" UNIQUE ("name"),
  CONSTRAINT "plugin_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "plugin_name_idx" ON "plugin" ("name");`.execute(db);
  await sql`CREATE TABLE "plugin_filter" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "pluginId" uuid NOT NULL,
  "methodName" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying NOT NULL,
  "supportedContexts" character varying[] NOT NULL,
  "schema" jsonb,
  CONSTRAINT "plugin_filter_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugin" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "plugin_filter_methodName_uq" UNIQUE ("methodName"),
  CONSTRAINT "plugin_filter_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "plugin_filter_supportedContexts_idx" ON "plugin_filter" USING gin ("supportedContexts");`.execute(
    db,
  );
  await sql`CREATE INDEX "plugin_filter_pluginId_idx" ON "plugin_filter" ("pluginId");`.execute(db);
  await sql`CREATE INDEX "plugin_filter_methodName_idx" ON "plugin_filter" ("methodName");`.execute(db);
  await sql`CREATE TABLE "plugin_action" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "pluginId" uuid NOT NULL,
  "methodName" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying NOT NULL,
  "supportedContexts" character varying[] NOT NULL,
  "schema" jsonb,
  CONSTRAINT "plugin_action_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugin" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "plugin_action_methodName_uq" UNIQUE ("methodName"),
  CONSTRAINT "plugin_action_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "plugin_action_supportedContexts_idx" ON "plugin_action" USING gin ("supportedContexts");`.execute(
    db,
  );
  await sql`CREATE INDEX "plugin_action_pluginId_idx" ON "plugin_action" ("pluginId");`.execute(db);
  await sql`CREATE INDEX "plugin_action_methodName_idx" ON "plugin_action" ("methodName");`.execute(db);
  await sql`CREATE TABLE "workflow" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL,
  "triggerType" character varying NOT NULL,
  "name" character varying,
  "description" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "enabled" boolean NOT NULL DEFAULT true,
  CONSTRAINT "workflow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_ownerId_idx" ON "workflow" ("ownerId");`.execute(db);
  await sql`CREATE TABLE "workflow_filter" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "workflowId" uuid NOT NULL,
  "filterId" uuid NOT NULL,
  "filterConfig" jsonb,
  "order" integer NOT NULL,
  CONSTRAINT "workflow_filter_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_filter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "plugin_filter" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_filter_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_filter_filterId_idx" ON "workflow_filter" ("filterId");`.execute(db);
  await sql`CREATE INDEX "workflow_filter_workflowId_order_idx" ON "workflow_filter" ("workflowId", "order");`.execute(
    db,
  );
  await sql`CREATE INDEX "workflow_filter_workflowId_idx" ON "workflow_filter" ("workflowId");`.execute(db);
  await sql`CREATE TABLE "workflow_action" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "workflowId" uuid NOT NULL,
  "actionId" uuid NOT NULL,
  "actionConfig" jsonb,
  "order" integer NOT NULL,
  CONSTRAINT "workflow_action_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_action_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "plugin_action" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_action_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_action_actionId_idx" ON "workflow_action" ("actionId");`.execute(db);
  await sql`CREATE INDEX "workflow_action_workflowId_order_idx" ON "workflow_action" ("workflowId", "order");`.execute(
    db,
  );
  await sql`CREATE INDEX "workflow_action_workflowId_idx" ON "workflow_action" ("workflowId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_plugin_filter_supportedContexts_idx', '{"type":"index","name":"plugin_filter_supportedContexts_idx","sql":"CREATE INDEX \\"plugin_filter_supportedContexts_idx\\" ON \\"plugin_filter\\" (\\"supportedContexts\\") USING gin;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_plugin_action_supportedContexts_idx', '{"type":"index","name":"plugin_action_supportedContexts_idx","sql":"CREATE INDEX \\"plugin_action_supportedContexts_idx\\" ON \\"plugin_action\\" (\\"supportedContexts\\") USING gin;"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "workflow";`.execute(db);
  await sql`DROP TABLE "workflow_filter";`.execute(db);
  await sql`DROP TABLE "workflow_action";`.execute(db);

  await sql`DROP TABLE "plugin";`.execute(db);
  await sql`DROP TABLE "plugin_filter";`.execute(db);
  await sql`DROP TABLE "plugin_action";`.execute(db);

  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_plugin_filter_supportedContexts_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_plugin_action_supportedContexts_idx';`.execute(db);
}
