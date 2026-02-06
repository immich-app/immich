import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Enable extensions
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "plpgsql"`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "vector"`.execute(db);

  // UUID v7 function
  await sql`
    CREATE OR REPLACE FUNCTION immich_uuid_v7(p_timestamp timestamp with time zone DEFAULT clock_timestamp())
    RETURNS uuid
    LANGUAGE SQL
    VOLATILE
    AS $$
      SELECT encode(
        set_bit(
          set_bit(
            overlay(uuid_send(gen_random_uuid())
                    placing substring(int8send(floor(extract(epoch from p_timestamp) * 1000)::bigint) from 3)
                    from 1 for 6
            ),
            52, 1
          ),
          53, 1
        ),
        'hex')::uuid;
    $$
  `.execute(db);

  // Updated at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION updated_at()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
    DECLARE
        clock_timestamp TIMESTAMP := clock_timestamp();
    BEGIN
        new."updatedAt" = clock_timestamp;
        new."updateId" = immich_uuid_v7(clock_timestamp);
        return new;
    END;
    $$
  `.execute(db);

  // User table
  await db.schema
    .createTable('user')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('email', 'varchar', (col) => col.unique().notNull())
    .addColumn('password', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('name', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('isAdmin', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('shouldChangePassword', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('status', 'varchar', (col) => col.notNull().defaultTo('active'))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deletedAt', 'timestamptz')
    .addColumn('updateId', 'uuid', (col) => col.notNull().defaultTo(sql`immich_uuid_v7()`))
    .execute();

  await db.schema.createIndex('IDX_user_updatedAt_id').on('user').columns(['updatedAt', 'id']).execute();
  await db.schema.createIndex('IDX_user_updateId').on('user').column('updateId').execute();
  await sql`CREATE TRIGGER "user_updatedAt" BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION updated_at()`.execute(db);

  // Session table
  await db.schema
    .createTable('session')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('token', 'varchar', (col) => col.notNull())
    .addColumn('userId', 'uuid', (col) => col.notNull().references('user.id').onUpdate('cascade').onDelete('cascade'))
    .addColumn('parentId', 'uuid', (col) => col.references('session.id').onUpdate('cascade').onDelete('cascade'))
    .addColumn('deviceType', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('deviceOS', 'varchar', (col) => col.notNull().defaultTo(''))
    .addColumn('appVersion', 'varchar')
    .addColumn('isPendingSyncReset', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('expiresAt', 'timestamptz')
    .addColumn('pinExpiresAt', 'timestamptz')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updateId', 'uuid', (col) => col.notNull().defaultTo(sql`immich_uuid_v7()`))
    .execute();

  await db.schema.createIndex('IDX_session_updateId').on('session').column('updateId').execute();
  await sql`CREATE TRIGGER "session_updatedAt" BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE FUNCTION updated_at()`.execute(db);

  // API Key table
  await db.schema
    .createTable('api_key')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('key', 'varchar', (col) => col.notNull())
    .addColumn('userId', 'uuid', (col) => col.notNull().references('user.id').onUpdate('cascade').onDelete('cascade'))
    .addColumn('permissions', sql`character varying[]`, (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updateId', 'uuid', (col) => col.notNull().defaultTo(sql`immich_uuid_v7()`))
    .execute();

  await db.schema.createIndex('IDX_api_key_updateId').on('api_key').column('updateId').execute();
  await sql`CREATE TRIGGER "api_key_updatedAt" BEFORE UPDATE ON "api_key" FOR EACH ROW EXECUTE FUNCTION updated_at()`.execute(db);

  // System metadata table
  await db.schema
    .createTable('system_metadata')
    .addColumn('key', 'varchar', (col) => col.primaryKey())
    .addColumn('value', 'jsonb', (col) => col.notNull())
    .execute();

  // Migrations tracking table
  await db.schema
    .createTable('migrations')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('timestamp', 'bigint', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('migrations').ifExists().execute();
  await db.schema.dropTable('system_metadata').ifExists().execute();
  await db.schema.dropTable('api_key').ifExists().execute();
  await db.schema.dropTable('session').ifExists().execute();
  await db.schema.dropTable('user').ifExists().execute();
  await sql`DROP FUNCTION IF EXISTS updated_at CASCADE`.execute(db);
  await sql`DROP FUNCTION IF EXISTS immich_uuid_v7 CASCADE`.execute(db);
  await sql`DROP EXTENSION IF EXISTS vector`.execute(db);
}
