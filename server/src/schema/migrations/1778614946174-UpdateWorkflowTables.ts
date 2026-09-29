import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // take #2...
  await sql`DROP TABLE "workflow_action";`.execute(db);
  await sql`DROP TABLE "workflow_filter";`.execute(db);
  await sql`DROP TABLE "workflow";`.execute(db);
  await sql`DROP TABLE "plugin_action";`.execute(db);
  await sql`DROP TABLE "plugin_filter";`.execute(db);
  await sql`DROP TABLE "plugin";`.execute(db);

  await sql`CREATE TABLE "plugin" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "enabled" boolean NOT NULL DEFAULT true,
  "name" character varying NOT NULL,
  "version" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying NOT NULL,
  "author" character varying NOT NULL,
  "wasmBytes" bytea NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "plugin_name_version_uq" UNIQUE ("name", "version"),
  CONSTRAINT "plugin_name_uq" UNIQUE ("name"),
  CONSTRAINT "plugin_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "plugin_name_idx" ON "plugin" ("name");`.execute(db);
  await sql`CREATE TABLE "plugin_method" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "pluginId" uuid NOT NULL,
  "name" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying NOT NULL,
  "types" character varying[] NOT NULL,
  "hostFunctions" boolean NOT NULL DEFAULT false,
  "uiHints" character varying[] NOT NULL DEFAULT '{}',
  "schema" jsonb,
  CONSTRAINT "plugin_method_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugin" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "plugin_method_pluginId_name_uq" UNIQUE ("pluginId", "name"),
  CONSTRAINT "plugin_method_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "plugin_method_pluginId_idx" ON "plugin_method" ("pluginId");`.execute(db);
  await sql`CREATE TABLE "workflow" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL,
  "trigger" character varying NOT NULL,
  "name" character varying,
  "description" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "enabled" boolean NOT NULL DEFAULT true,
  CONSTRAINT "workflow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_ownerId_idx" ON "workflow" ("ownerId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "workflow_updatedAt"
  BEFORE UPDATE ON "workflow"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "workflow_step" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "enabled" boolean NOT NULL DEFAULT true,
  "workflowId" uuid NOT NULL,
  "pluginMethodId" uuid NOT NULL,
  "config" jsonb,
  "order" integer NOT NULL,
  CONSTRAINT "workflow_step_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_step_pluginMethodId_fkey" FOREIGN KEY ("pluginMethodId") REFERENCES "plugin_method" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "workflow_step_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "workflow_step_workflowId_idx" ON "workflow_step" ("workflowId");`.execute(db);
  await sql`CREATE INDEX "workflow_step_pluginMethodId_idx" ON "workflow_step" ("pluginMethodId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_workflow_updatedAt', '{"type":"trigger","name":"workflow_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"workflow_updatedAt\\"\\n  BEFORE UPDATE ON \\"workflow\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(
    db,
  );
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_plugin_filter_supportedContexts_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_plugin_action_supportedContexts_idx';`.execute(db);
}

export async function down(): Promise<void> {
  // not supported
}
