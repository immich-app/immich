import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    INSERT INTO "user_metadata" ("userId", "key", "value")
    SELECT "user"."id", 'preferences', jsonb_build_object('people', jsonb_build_object('minimumFaces', "config"."minFaces"))
    FROM "user"
    CROSS JOIN (
      SELECT "value"->'machineLearning'->'facialRecognition'->'minFaces' AS "minFaces"
      FROM "system_metadata"
      WHERE "key" = 'system-config'
        AND "value"->'machineLearning'->'facialRecognition'->'minFaces' IS NOT NULL
    ) AS "config"
    ON CONFLICT ("userId", "key") DO UPDATE
    SET "value" = "user_metadata"."value" || jsonb_build_object(
      'people',
      COALESCE("user_metadata"."value"->'people', '{}'::jsonb) || (EXCLUDED."value"->'people')
    )
    WHERE "user_metadata"."value"->'people'->'minimumFaces' IS NULL
  `.execute(db);
}

export async function down(): Promise<void> {
  // not supported
}
