import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // AI metadata table for descriptions, date estimates, scene tags
  await db.schema
    .createTable('ai_metadata')
    .addColumn('asset_id', 'uuid', (col) => col.primaryKey().references('assets.id').onDelete('cascade'))
    .addColumn('ai_description', 'text')
    .addColumn('ai_description_model', 'varchar(255)')
    .addColumn('ai_description_confidence', 'real')
    .addColumn('estimated_year', 'integer')
    .addColumn('estimated_decade', 'varchar(10)')
    .addColumn('date_confidence', 'real')
    .addColumn('date_reasoning', 'text')
    .addColumn('date_signals', sql`text[]`)
    .addColumn('quality_score', 'real')
    .addColumn('quality_factors', sql`text[]`)
    .addColumn('processed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  // Scene tags table
  await db.schema
    .createTable('ai_scene_tags')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('asset_id', 'uuid', (col) => col.notNull().references('assets.id').onDelete('cascade'))
    .addColumn('tag', 'varchar(100)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull())
    .addColumn('confidence', 'real', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('idx_ai_scene_tags_asset')
    .on('ai_scene_tags')
    .column('asset_id')
    .execute();

  await db.schema
    .createIndex('idx_ai_scene_tags_tag')
    .on('ai_scene_tags')
    .column('tag')
    .execute();

  // Video transcriptions table
  await db.schema
    .createTable('video_transcriptions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('asset_id', 'uuid', (col) => col.notNull().references('assets.id').onDelete('cascade'))
    .addColumn('language', 'varchar(10)')
    .addColumn('full_text', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('idx_video_transcriptions_asset')
    .on('video_transcriptions')
    .column('asset_id')
    .execute();

  // Video transcription segments
  await db.schema
    .createTable('video_transcription_segments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('transcription_id', 'uuid', (col) =>
      col.notNull().references('video_transcriptions.id').onDelete('cascade'),
    )
    .addColumn('start_ms', 'integer', (col) => col.notNull())
    .addColumn('end_ms', 'integer', (col) => col.notNull())
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('confidence', 'real')
    .addColumn('speaker', 'varchar(100)')
    .execute();

  // Video highlights table
  await db.schema
    .createTable('video_highlights')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('asset_id', 'uuid', (col) => col.notNull().references('assets.id').onDelete('cascade'))
    .addColumn('timestamp_ms', 'integer', (col) => col.notNull())
    .addColumn('duration_ms', 'integer', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('score', 'real')
    .addColumn('thumbnail_path', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('idx_video_highlights_asset')
    .on('video_highlights')
    .column('asset_id')
    .execute();

  // Video chapters table
  await db.schema
    .createTable('video_chapters')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('asset_id', 'uuid', (col) => col.notNull().references('assets.id').onDelete('cascade'))
    .addColumn('start_ms', 'integer', (col) => col.notNull())
    .addColumn('end_ms', 'integer', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('idx_video_chapters_asset')
    .on('video_chapters')
    .column('asset_id')
    .execute();

  // Webhooks configuration table
  await db.schema
    .createTable('webhooks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('url', 'varchar(2048)', (col) => col.notNull())
    .addColumn('secret', 'varchar(255)')
    .addColumn('events', sql`text[]`, (col) => col.notNull())
    .addColumn('enabled', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('retry_count', 'integer', (col) => col.defaultTo(3).notNull())
    .addColumn('last_delivery_at', 'timestamptz')
    .addColumn('last_delivery_status', 'varchar(10)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  // Webhook delivery log
  await db.schema
    .createTable('webhook_deliveries')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('webhook_id', 'uuid', (col) => col.notNull().references('webhooks.id').onDelete('cascade'))
    .addColumn('event', 'varchar(100)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('response_status', 'integer')
    .addColumn('response_body', 'text')
    .addColumn('attempt', 'integer', (col) => col.defaultTo(1).notNull())
    .addColumn('delivered_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('idx_webhook_deliveries_webhook')
    .on('webhook_deliveries')
    .column('webhook_id')
    .execute();

  // Privacy zones table
  await db.schema
    .createTable('privacy_zones')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('latitude', 'double precision', (col) => col.notNull())
    .addColumn('longitude', 'double precision', (col) => col.notNull())
    .addColumn('radius_meters', 'integer', (col) => col.notNull())
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  // Trips table
  await db.schema
    .createTable('trips')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('start_date', 'timestamptz', (col) => col.notNull())
    .addColumn('end_date', 'timestamptz', (col) => col.notNull())
    .addColumn('asset_count', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  // Trip locations
  await db.schema
    .createTable('trip_locations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`immich_uuid_v7()`))
    .addColumn('trip_id', 'uuid', (col) => col.notNull().references('trips.id').onDelete('cascade'))
    .addColumn('latitude', 'double precision', (col) => col.notNull())
    .addColumn('longitude', 'double precision', (col) => col.notNull())
    .addColumn('city', 'varchar(255)')
    .addColumn('state', 'varchar(255)')
    .addColumn('country', 'varchar(255)')
    .addColumn('timestamp', 'timestamptz', (col) => col.notNull())
    .execute();

  // Trip-asset junction table
  await db.schema
    .createTable('trip_assets')
    .addColumn('trip_id', 'uuid', (col) => col.notNull().references('trips.id').onDelete('cascade'))
    .addColumn('asset_id', 'uuid', (col) => col.notNull().references('assets.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('pk_trip_assets', ['trip_id', 'asset_id'])
    .execute();

  // Full-text search index on AI descriptions
  await sql`CREATE INDEX idx_ai_metadata_description_fts ON ai_metadata USING gin(to_tsvector('english', ai_description))`.execute(db);

  // Full-text search index on video transcriptions
  await sql`CREATE INDEX idx_video_transcriptions_fts ON video_transcriptions USING gin(to_tsvector('english', full_text))`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trip_assets').ifExists().execute();
  await db.schema.dropTable('trip_locations').ifExists().execute();
  await db.schema.dropTable('trips').ifExists().execute();
  await db.schema.dropTable('privacy_zones').ifExists().execute();
  await db.schema.dropTable('webhook_deliveries').ifExists().execute();
  await db.schema.dropTable('webhooks').ifExists().execute();
  await db.schema.dropTable('video_chapters').ifExists().execute();
  await db.schema.dropTable('video_highlights').ifExists().execute();
  await db.schema.dropTable('video_transcription_segments').ifExists().execute();
  await db.schema.dropTable('video_transcriptions').ifExists().execute();
  await db.schema.dropTable('ai_scene_tags').ifExists().execute();
  await db.schema.dropTable('ai_metadata').ifExists().execute();
}
