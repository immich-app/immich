import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "person_type_enum" AS ENUM ('HUMAN', 'PET');`.execute(db);
  
  await sql`ALTER TABLE "person" ADD "type" person_type_enum DEFAULT 'HUMAN' NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "personType" person_type_enum DEFAULT 'HUMAN' NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_face" DROP COLUMN "personType";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "type";`.execute(db);
  await sql`DROP TYPE "person_type_enum";`.execute(db);
}
