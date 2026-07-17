import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "albums" ALTER COLUMN "description" DROP DEFAULT, ALTER COLUMN "description" DROP NOT NULL`.execute(
    db,
  );
  await sql`UPDATE "albums" SET "description" = NULL WHERE "description" = ''`.execute(db);

  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" DROP DEFAULT, ALTER COLUMN "description" DROP NOT NULL`.execute(
    db,
  );
  await sql`UPDATE "asset_exif" SET "description" = NULL WHERE "description" = ''`.execute(db);
}

export async function down(): Promise<void> {
  // not supported
}
