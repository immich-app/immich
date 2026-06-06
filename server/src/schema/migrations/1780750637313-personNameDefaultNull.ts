import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "name" DROP NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET NOT NULL;`.execute(db);
}
