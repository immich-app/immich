import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "petsEnabled" boolean NOT NULL DEFAULT true`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "type" character varying NOT NULL DEFAULT 'person'`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "type"`.execute(db);
  await sql`ALTER TABLE "shared_space" DROP COLUMN "petsEnabled"`.execute(db);
}
