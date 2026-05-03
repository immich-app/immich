import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "face_identity" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "type" character varying NOT NULL DEFAULT 'person',
      "representativeFaceId" uuid,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "face_identity_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "face_identity_type_chk" CHECK ("type" IN ('person', 'pet')),
      CONSTRAINT "face_identity_representativeFaceId_fkey" FOREIGN KEY ("representativeFaceId") REFERENCES "asset_face" ("id") ON DELETE SET NULL
    )
  `.execute(db);

  await sql`CREATE INDEX "face_identity_updateId_idx" ON "face_identity" ("updateId")`.execute(db);
  await sql`CREATE INDEX "face_identity_representativeFaceId_idx" ON "face_identity" ("representativeFaceId") WHERE "representativeFaceId" IS NOT NULL`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_face_identity_representativeFaceId_idx', '{"type":"index","name":"face_identity_representativeFaceId_idx","sql":"CREATE INDEX \\"face_identity_representativeFaceId_idx\\" ON \\"face_identity\\" (\\"representativeFaceId\\") WHERE \\"representativeFaceId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );
  await sql`
    CREATE OR REPLACE TRIGGER "face_identity_updatedAt"
    BEFORE UPDATE ON "face_identity"
    FOR EACH ROW
    EXECUTE FUNCTION updated_at()
  `.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_face_identity_updatedAt', '{"type":"trigger","name":"face_identity_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"face_identity_updatedAt\\"\\n  BEFORE UPDATE ON \\"face_identity\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb)`.execute(
    db,
  );

  await sql`
    CREATE TABLE "face_identity_face" (
      "assetFaceId" uuid NOT NULL,
      "identityId" uuid NOT NULL,
      "source" character varying NOT NULL DEFAULT 'owner-person',
      "confidence" double precision,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "face_identity_face_pkey" PRIMARY KEY ("assetFaceId"),
      CONSTRAINT "face_identity_face_assetFaceId_fkey" FOREIGN KEY ("assetFaceId") REFERENCES "asset_face" ("id") ON DELETE CASCADE,
      CONSTRAINT "face_identity_face_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "face_identity" ("id") ON DELETE CASCADE,
      CONSTRAINT "face_identity_face_source_chk" CHECK ("source" IN ('owner-person', 'ml', 'backfill', 'shared-space-evidence', 'manual', 'import'))
    )
  `.execute(db);

  await sql`CREATE INDEX "face_identity_face_identityId_assetFaceId_idx" ON "face_identity_face" ("identityId", "assetFaceId")`.execute(
    db,
  );
  await sql`CREATE INDEX "face_identity_face_updateId_idx" ON "face_identity_face" ("updateId")`.execute(db);
  await sql`
    CREATE OR REPLACE TRIGGER "face_identity_face_updatedAt"
    BEFORE UPDATE ON "face_identity_face"
    FOR EACH ROW
    EXECUTE FUNCTION updated_at()
  `.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_face_identity_face_updatedAt', '{"type":"trigger","name":"face_identity_face_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"face_identity_face_updatedAt\\"\\n  BEFORE UPDATE ON \\"face_identity_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb)`.execute(
    db,
  );

  await sql`ALTER TABLE "person" ADD COLUMN "identityId" uuid REFERENCES "face_identity" ("id") ON DELETE SET NULL`.execute(
    db,
  );
  await sql`CREATE INDEX "person_identityId_idx" ON "person" ("identityId") WHERE "identityId" IS NOT NULL`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_person_identityId_idx', '{"type":"index","name":"person_identityId_idx","sql":"CREATE INDEX \\"person_identityId_idx\\" ON \\"person\\" (\\"identityId\\") WHERE \\"identityId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX "person_ownerId_identityId_key" ON "person" ("ownerId", "identityId") WHERE "identityId" IS NOT NULL`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_person_ownerId_identityId_key', '{"type":"index","name":"person_ownerId_identityId_key","sql":"CREATE UNIQUE INDEX \\"person_ownerId_identityId_key\\" ON \\"person\\" (\\"ownerId\\", \\"identityId\\") WHERE \\"identityId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS "asset_face_personId_idx" ON "asset_face" ("personId") WHERE "personId" IS NOT NULL`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personId_idx', '{"type":"index","name":"asset_face_personId_idx","sql":"CREATE INDEX \\"asset_face_personId_idx\\" ON \\"asset_face\\" (\\"personId\\") WHERE \\"personId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );

  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "identityId" uuid REFERENCES "face_identity" ("id") ON DELETE SET NULL`.execute(
    db,
  );
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "nameSource" character varying NOT NULL DEFAULT 'none'`.execute(
    db,
  );
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "nameSourceProfileType" character varying`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "nameSourceProfileId" uuid`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "nameSourceUpdatedAt" timestamp with time zone`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "birthDateSource" character varying NOT NULL DEFAULT 'none'`.execute(
    db,
  );
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "birthDateSourceProfileType" character varying`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "birthDateSourceProfileId" uuid`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD COLUMN "birthDateSourceUpdatedAt" timestamp with time zone`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX "shared_space_person_spaceId_identityId_key" ON "shared_space_person" ("spaceId", "identityId") WHERE "identityId" IS NOT NULL`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_shared_space_person_spaceId_identityId_key', '{"type":"index","name":"shared_space_person_spaceId_identityId_key","sql":"CREATE UNIQUE INDEX \\"shared_space_person_spaceId_identityId_key\\" ON \\"shared_space_person\\" (\\"spaceId\\", \\"identityId\\") WHERE \\"identityId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );
  await sql`CREATE INDEX "shared_space_person_identityId_spaceId_idx" ON "shared_space_person" ("identityId", "spaceId") WHERE "identityId" IS NOT NULL`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_shared_space_person_identityId_spaceId_idx', '{"type":"index","name":"shared_space_person_identityId_spaceId_idx","sql":"CREATE INDEX \\"shared_space_person_identityId_spaceId_idx\\" ON \\"shared_space_person\\" (\\"identityId\\", \\"spaceId\\") WHERE \\"identityId\\" IS NOT NULL;"}'::jsonb)`.execute(
    db,
  );

  await sql`ALTER TABLE "shared_space_member" ADD COLUMN "sharePersonMetadata" boolean NOT NULL DEFAULT true`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN IF EXISTS "sharePersonMetadata"`.execute(db);
  await sql`DROP INDEX IF EXISTS "shared_space_person_identityId_spaceId_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "shared_space_person_spaceId_identityId_key"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "birthDateSourceUpdatedAt"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "birthDateSourceProfileId"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "birthDateSourceProfileType"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "birthDateSource"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "nameSourceUpdatedAt"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "nameSourceProfileId"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "nameSourceProfileType"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "nameSource"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN IF EXISTS "identityId"`.execute(db);
  await sql`DROP INDEX IF EXISTS "asset_face_personId_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "person_ownerId_identityId_key"`.execute(db);
  await sql`DROP INDEX IF EXISTS "person_identityId_idx"`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN IF EXISTS "identityId"`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" IN ('trigger_face_identity_updatedAt', 'trigger_face_identity_face_updatedAt', 'index_face_identity_representativeFaceId_idx', 'index_person_identityId_idx', 'index_person_ownerId_identityId_key', 'index_asset_face_personId_idx', 'index_shared_space_person_spaceId_identityId_key', 'index_shared_space_person_identityId_spaceId_idx')`.execute(
    db,
  );
  await sql`DROP TRIGGER IF EXISTS "face_identity_face_updatedAt" ON "face_identity_face"`.execute(db);
  await sql`DROP INDEX IF EXISTS "face_identity_face_updateId_idx"`.execute(db);
  await sql`DROP TABLE IF EXISTS "face_identity_face"`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "face_identity_updatedAt" ON "face_identity"`.execute(db);
  await sql`DROP TABLE IF EXISTS "face_identity"`.execute(db);
}
