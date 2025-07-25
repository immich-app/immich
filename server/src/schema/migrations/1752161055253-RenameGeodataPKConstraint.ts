import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "geodata_places" DROP CONSTRAINT IF EXISTS "PK_c29918988912ef4036f3d7fbff4";`.execute(db);
  await sql`ALTER TABLE "geodata_places" DROP CONSTRAINT IF EXISTS "geodata_places_pkey"`.execute(db);
  await sql`ALTER TABLE "geodata_places" ADD CONSTRAINT "geodata_places_pkey" PRIMARY KEY ("id");`.execute(db);
}

export async function down(): Promise<void> {}
