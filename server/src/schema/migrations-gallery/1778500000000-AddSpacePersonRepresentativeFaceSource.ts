import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('shared_space_person')
    .addColumn('representativeFaceSource', 'varchar', (column) => column.notNull().defaultTo('auto'))
    .execute();

  await sql`
    ALTER TABLE "shared_space_person"
    ADD CONSTRAINT "shared_space_person_representativeFaceSource_chk"
    CHECK ("representativeFaceSource" IN ('auto', 'manual'))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE "shared_space_person"
    DROP CONSTRAINT IF EXISTS "shared_space_person_representativeFaceSource_chk"
  `.execute(db);

  await db.schema.alterTable('shared_space_person').dropColumn('representativeFaceSource').execute();
}
