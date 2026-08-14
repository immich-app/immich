import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
  ALTER TABLE asset
  ALTER COLUMN duration TYPE integer
  USING (
    CASE
      WHEN duration ~ '^\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$'
        THEN substr(duration, 1, 2)::int * 3600000
           + substr(duration, 4, 2)::int * 60000
           + substr(duration, 7, 2)::int * 1000
           + substr(duration, 10, 3)::int
    END
  );`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
  ALTER TABLE asset
  ALTER COLUMN duration TYPE varchar
  USING (
    CASE
      WHEN duration IS NULL THEN NULL
      ELSE lpad((duration / 3600000)::text, 2, '0')
        || ':' || lpad(((duration / 60000) % 60)::text, 2, '0')
        || ':' || lpad(((duration / 1000) % 60)::text, 2, '0')
        || '.' || lpad((duration % 1000)::text, 3, '0')
    END
  );`.execute(db);
}
