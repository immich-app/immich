export async function up(): Promise<void> {
  // await sql`UPDATE "asset_exif" SET "rating" = NULL WHERE "rating" = -1;`.execute(db);
}

export async function down(): Promise<void> {
  // not supported
}
