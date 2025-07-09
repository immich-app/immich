import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER INDEX "IDX_3571467bcbe021f66e2bdce96e" RENAME TO "activity_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_1af8519996fbfb3684b58df280" RENAME TO "activity_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_8091ea76b12338cb4428d33d78" RENAME TO "activity_assetId_idx";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" TO "activity_pkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_1af8519996fbfb3684b58df280b" TO "activity_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" TO "activity_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_8091ea76b12338cb4428d33d782" TO "activity_assetId_fkey";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER INDEX "activity_userId_idx" RENAME TO "IDX_3571467bcbe021f66e2bdce96e";`.execute(db);
  await sql`ALTER INDEX "activity_albumId_idx" RENAME TO "IDX_1af8519996fbfb3684b58df280";`.execute(db);
  await sql`ALTER INDEX "activity_assetId_idx" RENAME TO "IDX_8091ea76b12338cb4428d33d78";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_pkey" TO "PK_24625a1d6b1b089c8ae206fe467";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_albumId_fkey" TO "FK_1af8519996fbfb3684b58df280b";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_userId_fkey" TO "FK_3571467bcbe021f66e2bdce96ea";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_assetId_fkey" TO "FK_8091ea76b12338cb4428d33d782";`.execute(db);
}
