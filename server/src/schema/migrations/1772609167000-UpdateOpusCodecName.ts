import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE system_metadata
    SET value = jsonb_set(
      value,
      '{ffmpeg,acceptedAudioCodecs}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN elem = 'libopus' THEN 'opus'
            ELSE elem
          END
        )
        FROM jsonb_array_elements_text(value->'ffmpeg'->'acceptedAudioCodecs') elem
      )
    )
    WHERE key = 'system-config'
    AND value->'ffmpeg'->'acceptedAudioCodecs' ? 'libopus';
  `.execute(db);

  await sql`
    UPDATE system_metadata
    SET value = jsonb_set(
      value,
      '{ffmpeg,targetAudioCodec}',
      '"opus"'::jsonb
    )
    WHERE key = 'system-config'
    AND value->'ffmpeg'->>'targetAudioCodec' = 'libopus';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE system_metadata
    SET value = jsonb_set(
      value,
      '{ffmpeg,acceptedAudioCodecs}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN elem = 'opus' THEN 'libopus'
            ELSE elem
          END
        )
        FROM jsonb_array_elements_text(value->'ffmpeg'->'acceptedAudioCodecs') elem
      )
    )
    WHERE key = 'system-config'
    AND value->'ffmpeg'->'acceptedAudioCodecs' ? 'opus';
  `.execute(db);

  await sql`
    UPDATE system_metadata
    SET value = jsonb_set(
      value,
      '{ffmpeg,targetAudioCodec}',
      '"libopus"'::jsonb
    )
    WHERE key = 'system-config'
    AND value->'ffmpeg'->>'targetAudioCodec' = 'opus';
  `.execute(db);
}
