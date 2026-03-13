import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add faceRecognitionEnabled to shared_space
  await db.schema
    .alterTable('shared_space')
    .addColumn('faceRecognitionEnabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .execute();

  // Create shared_space_person table
  await db.schema
    .createTable('shared_space_person')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('spaceId', 'uuid', (col) => col.notNull().references('shared_space.id').onDelete('cascade'))
    .addColumn('name', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('representativeFaceId', 'uuid', (col) => col.references('asset_face.id').onDelete('set null'))
    .addColumn('thumbnailPath', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('isHidden', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('birthDate', 'date')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updateId', 'uuid', (col) => col.notNull().defaultTo(sql`immich_uuid_v7()`))
    .execute();

  await db.schema
    .createIndex('shared_space_person_updateId_idx')
    .on('shared_space_person')
    .columns(['updateId'])
    .execute();

  await db.schema
    .createIndex('shared_space_person_spaceId_idx')
    .on('shared_space_person')
    .columns(['spaceId'])
    .execute();

  await db.schema
    .createIndex('shared_space_person_representativeFaceId_idx')
    .on('shared_space_person')
    .columns(['representativeFaceId'])
    .execute();

  // Create updatedAt trigger for shared_space_person
  await sql`
    CREATE TRIGGER "shared_space_person_updatedAt"
    BEFORE UPDATE ON "shared_space_person"
    FOR EACH ROW EXECUTE FUNCTION updated_at()
  `.execute(db);

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_shared_space_person_updatedAt', '{"type":"trigger","name":"shared_space_person_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"shared_space_person_updatedAt\\"\\n  BEFORE UPDATE ON \\"shared_space_person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(
    db,
  );

  // Create shared_space_person_face junction table
  await db.schema
    .createTable('shared_space_person_face')
    .addColumn('personId', 'uuid', (col) => col.notNull().references('shared_space_person.id').onDelete('cascade'))
    .addColumn('assetFaceId', 'uuid', (col) => col.notNull().references('asset_face.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('shared_space_person_face_pkey', ['personId', 'assetFaceId'])
    .execute();

  await db.schema
    .createIndex('shared_space_person_face_assetFaceId_idx')
    .on('shared_space_person_face')
    .columns(['assetFaceId'])
    .execute();

  // Create shared_space_person_alias table
  await db.schema
    .createTable('shared_space_person_alias')
    .addColumn('personId', 'uuid', (col) => col.notNull().references('shared_space_person.id').onDelete('cascade'))
    .addColumn('userId', 'uuid', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('alias', 'varchar', (col) => col.notNull())
    .addPrimaryKeyConstraint('shared_space_person_alias_pkey', ['personId', 'userId'])
    .execute();

  await db.schema
    .createIndex('shared_space_person_alias_userId_idx')
    .on('shared_space_person_alias')
    .columns(['userId'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('shared_space_person_alias').ifExists().execute();
  await db.schema.dropTable('shared_space_person_face').ifExists().execute();
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_shared_space_person_updatedAt';`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "shared_space_person_updatedAt" ON "shared_space_person"`.execute(db);
  await db.schema.dropTable('shared_space_person').ifExists().execute();
  await db.schema.alterTable('shared_space').dropColumn('faceRecognitionEnabled').execute();
}
