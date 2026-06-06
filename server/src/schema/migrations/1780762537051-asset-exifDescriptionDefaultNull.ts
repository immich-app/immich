import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset-exif" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset-exif" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
}
