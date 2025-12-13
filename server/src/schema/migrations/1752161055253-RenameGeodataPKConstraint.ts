import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname
        INTO constraint_name
        FROM pg_catalog.pg_constraint con
               JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'geodata_places' AND con.contype = 'p';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "geodata_places" DROP CONSTRAINT "' || constraint_name || '"';
        END IF;
      END;
    $$;
  `.execute(db);
  await sql`ALTER TABLE "geodata_places" ADD CONSTRAINT "geodata_places_pkey" PRIMARY KEY ("id");`.execute(db);
}

export async function down(): Promise<void> {}
