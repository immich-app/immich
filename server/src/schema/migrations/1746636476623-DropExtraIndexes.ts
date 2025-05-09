import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{ db: string }>`SELECT current_database() as db`.execute(db);
  const databaseName = rows[0].db;
  await sql.raw(`ALTER DATABASE "${databaseName}" SET search_path TO "$user", public, vectors`).execute(db);
  const naturalearth_pkey = await sql<{ constraint_name: string }>`SELECT constraint_name
                         FROM information_schema.table_constraints
                         WHERE table_schema = 'public'
                           AND table_name = 'naturalearth_countries'
                           AND constraint_type = 'PRIMARY KEY';`.execute(db);
  const naturalearth_pkey_name = naturalearth_pkey.rows[0]?.constraint_name;
  if(naturalearth_pkey_name) {
    await sql`ALTER TABLE "naturalearth_countries"
      DROP CONSTRAINT ${sql.ref(naturalearth_pkey_name)};`.execute(db);
  }
  await sql`ALTER TABLE "naturalearth_countries" ADD CONSTRAINT "naturalearth_countries_pkey" PRIMARY KEY ("id") WITH (FILLFACTOR = 100);`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_02a43fd0b3c50fb6d7f0cb7282";`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_95ad7106dd7b484275443f580f";`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_7e077a8b70b3530138610ff5e0";`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_92e67dc508c705dd66c9461557";`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_6afb43681a21cf7815932bc38a";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{ db: string }>`SELECT current_database() as db`.execute(db);
  const databaseName = rows[0].db;
  await sql.raw(`ALTER DATABASE "${databaseName}" RESET "search_path"`).execute(db);
}
