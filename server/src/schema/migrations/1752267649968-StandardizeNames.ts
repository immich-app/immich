import { Kysely, sql } from 'kysely';

type RenameItem = { oldName: string; newName: string };

const tables: RenameItem[] = [
  { oldName: 'album_assets_audit', newName: 'album_asset_audit' },
  { oldName: 'albums_assets_assets', newName: 'album_asset' },
  { oldName: 'albums_audit', newName: 'album_audit' },
  { oldName: 'album_users_audit', newName: 'album_user_audit' },
  { oldName: 'albums_shared_users_users', newName: 'album_user' },
  { oldName: 'albums', newName: 'album' },
  { oldName: 'api_keys', newName: 'api_key' },
  { oldName: 'assets_audit', newName: 'asset_audit' },
  { oldName: 'assets', newName: 'asset' },
  { oldName: 'asset_faces', newName: 'asset_face' },
  { oldName: 'asset_files', newName: 'asset_file' },
  { oldName: 'exif', newName: 'asset_exif' },
  { oldName: 'libraries', newName: 'library' },
  { oldName: 'memory_assets_audit', newName: 'memory_asset_audit' },
  { oldName: 'memories_assets_assets', newName: 'memory_asset' },
  { oldName: 'memories_audit', newName: 'memory_audit' },
  { oldName: 'memories', newName: 'memory' },
  { oldName: 'notifications', newName: 'notification' },
  { oldName: 'partners_audit', newName: 'partner_audit' },
  { oldName: 'partners', newName: 'partner' },
  { oldName: 'sessions', newName: 'session' },
  { oldName: 'shared_link__asset', newName: 'shared_link_asset' },
  { oldName: 'shared_links', newName: 'shared_link' },
  { oldName: 'stacks_audit', newName: 'stack_audit' },
  { oldName: 'asset_stack', newName: 'stack' },
  { oldName: 'session_sync_checkpoints', newName: 'session_sync_checkpoint' },
  { oldName: 'tags_closure', newName: 'tag_closure' },
  { oldName: 'tags', newName: 'tag' },
  { oldName: 'users_audit', newName: 'user_audit' },
  { oldName: 'users', newName: 'user' },
];

export async function up(db: Kysely<any>): Promise<void> {
  for (const { oldName, newName } of tables) {
    await sql.raw(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`).execute(db);
  }
  
  await sql`CREATE OR REPLACE FUNCTION album_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumsId" FROM inserted_rows);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION user_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO user_audit ("userId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION partner_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO partner_audit ("sharedById", "sharedWithId")
      SELECT "sharedById", "sharedWithId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_asset_audit ("albumId", "assetId")
      SELECT "albumsId", "assetsId" FROM OLD
      WHERE "albumsId" IN (SELECT "id" FROM album WHERE "id" IN (SELECT "albumsId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_user_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "albumsId", "usersId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_user_audit ("albumId", "userId")
        SELECT "albumsId", "usersId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION memory_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO memory_audit ("memoryId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION memory_asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO memory_asset_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetsId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memory WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION stack_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO stack_audit ("stackId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`DROP TRIGGER "users_delete_audit" ON "user";`.execute(db);
  await sql`DROP TRIGGER "users_updated_at" ON "user";`.execute(db);
  await sql`DROP TRIGGER "libraries_updated_at" ON "library";`.execute(db);
  await sql`DROP TRIGGER "stacks_delete_audit" ON "stack";`.execute(db);
  await sql`DROP TRIGGER "stacks_updated_at" ON "stack";`.execute(db);
  await sql`DROP TRIGGER "assets_delete_audit" ON "asset";`.execute(db);
  await sql`DROP TRIGGER "assets_updated_at" ON "asset";`.execute(db);
  await sql`DROP TRIGGER "albums_updated_at" ON "album";`.execute(db);
  await sql`DROP TRIGGER "albums_delete_audit" ON "album";`.execute(db);
  await sql`DROP TRIGGER "album_assets_updated_at" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "album_assets_delete_audit" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "activity_updated_at" ON "activity";`.execute(db);
  await sql`DROP TRIGGER "album_users_delete_audit" ON "album_user";`.execute(db);
  await sql`DROP TRIGGER "album_users_updated_at" ON "album_user";`.execute(db);
  await sql`DROP TRIGGER "api_keys_updated_at" ON "api_key";`.execute(db);
  await sql`DROP TRIGGER "asset_exif_updated_at" ON "asset_exif";`.execute(db);
  await sql`DROP TRIGGER "person_updated_at" ON "person";`.execute(db);
  await sql`DROP TRIGGER "asset_files_updated_at" ON "asset_file";`.execute(db);
  await sql`DROP TRIGGER "memories_updated_at" ON "memory";`.execute(db);
  await sql`DROP TRIGGER "memories_delete_audit" ON "memory";`.execute(db);
  await sql`DROP TRIGGER "memory_assets_updated_at" ON "memory_asset";`.execute(db);
  await sql`DROP TRIGGER "memory_assets_delete_audit" ON "memory_asset";`.execute(db);
  await sql`DROP TRIGGER "notifications_updated_at" ON "notification";`.execute(db);
  await sql`DROP TRIGGER "partners_delete_audit" ON "partner";`.execute(db);
  await sql`DROP TRIGGER "partners_updated_at" ON "partner";`.execute(db);
  await sql`DROP TRIGGER "sessions_updated_at" ON "session";`.execute(db);
  await sql`DROP TRIGGER "session_sync_checkpoints_updated_at" ON "session_sync_checkpoint";`.execute(db);
  await sql`DROP TRIGGER "tags_updated_at" ON "tag";`.execute(db);
  await sql`ALTER TABLE "user_metadata_audit" RENAME CONSTRAINT "PK_15d5cc4d65ac966233b9921acac" TO "user_metadata_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" TO "user_pkey";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" TO "user_email_uq";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "UQ_b309cf34fa58137c416b32cea3a" TO "user_storageLabel_uq";`.execute(db);
  await sql`ALTER TABLE "library" RENAME CONSTRAINT "PK_505fedfcad00a09b3734b4223de" TO "library_pkey";`.execute(db);
  await sql`ALTER TABLE "library" RENAME CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1" TO "library_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "PK_74a27e7fcbd5852463d0af3034b" TO "stack_pkey";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "FK_91704e101438fd0653f582426dc" TO "stack_primaryAssetId_fkey";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "FK_c05079e542fd74de3b5ecb5c1c8" TO "stack_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "REL_91704e101438fd0653f582426d" TO "stack_primaryAssetId_uq";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "PK_da96729a8b113377cfb6a62439c" TO "asset_pkey";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "FK_2c5ac0d6fb58b238fd2068de67d" TO "asset_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" TO "asset_livePhotoVideoId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c" TO "asset_libraryId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207" TO "asset_stackId_fkey";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "PK_7f71c7b5bc7c87b8f94c9a93a00" TO "album_pkey";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4" TO "album_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "FK_05895aa505a670300d4816debce" TO "album_albumThumbnailAssetId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180" TO "album_asset_pkey";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "FK_e590fa396c6898fcd4a50e40927" TO "album_asset_albumsId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" TO "album_asset_assetsId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" TO "activity_pkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_1af8519996fbfb3684b58df280b" TO "activity_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" TO "activity_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "FK_8091ea76b12338cb4428d33d782" TO "activity_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "CHK_2ab1e70f113f450eb40c1e3ec8" TO "activity_like_check";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "fk_activity_album_asset_composite" TO "activity_albumId_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_asset_audit" RENAME CONSTRAINT "PK_32969b576ec8f78d84f37c2eb2d" TO "album_asset_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "album_asset_audit" RENAME CONSTRAINT "FK_8047b44b812619a3c75a2839b0d" TO "album_asset_audit_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_audit" RENAME CONSTRAINT "PK_c75efea8d4dce316ad29b851a8b" TO "album_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "album_user_audit" RENAME CONSTRAINT "PK_f479a2e575b7ebc9698362c1688" TO "album_user_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "PK_7df55657e0b2e8b626330a0ebc8" TO "album_user_pkey";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "FK_427c350ad49bd3935a50baab737" TO "album_user_albumsId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "FK_f48513bf9bccefd6ff3ad30bd06" TO "album_user_usersId_fkey";`.execute(db);
  await sql`ALTER TABLE "api_key" RENAME CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" TO "api_key_pkey";`.execute(db);
  await sql`ALTER TABLE "api_key" RENAME CONSTRAINT "FK_6c2e267ae764a9413b863a29342" TO "api_key_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_audit" RENAME CONSTRAINT "PK_99bd5c015f81a641927a32b4212" TO "asset_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "asset_exif" RENAME CONSTRAINT "PK_c0117fdbc50b917ef9067740c44" TO "asset_exif_pkey";`.execute(db);
  await sql`ALTER TABLE "asset_exif" RENAME CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" TO "asset_exif_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" TO "person_pkey";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "FK_5527cc99f530a547093f9e577b6" TO "person_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" TO "person_faceAssetId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "CHK_b0f82b0ed662bfc24fbb58bb45" TO "person_birthDate_chk";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "PK_6df76ab2eb6f5b57b7c2f1fc684" TO "asset_face_pkey";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c" TO "asset_face_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "FK_95ad7106dd7b484275443f580f9" TO "asset_face_personId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "PK_c41dc3e9ef5e1c57ca5a08a0004" TO "asset_file_pkey";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" TO "asset_file_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "UQ_assetId_type" TO "asset_file_assetId_type_uq";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" RENAME CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4" TO "asset_job_status_pkey";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" RENAME CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4" TO "asset_job_status_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "audit" RENAME CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" TO "audit_pkey";`.execute(db);
  await sql`ALTER TABLE "memory" RENAME CONSTRAINT "PK_aaa0692d9496fe827b0568612f8" TO "memory_pkey";`.execute(db);
  await sql`ALTER TABLE "memory" RENAME CONSTRAINT "FK_575842846f0c28fa5da46c99b19" TO "memory_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset_audit" RENAME CONSTRAINT "PK_35ef16910228f980e0766dcc59b" TO "memory_asset_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset_audit" RENAME CONSTRAINT "FK_225a204afcb0bd6de015080fb03" TO "memory_asset_audit_memoryId_fkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "PK_fcaf7112a013d1703c011c6793d" TO "memory_asset_pkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "FK_984e5c9ab1f04d34538cd32334e" TO "memory_asset_memoriesId_fkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f" TO "memory_asset_assetsId_fkey";`.execute(db);
  await sql`ALTER TABLE "memory_audit" RENAME CONSTRAINT "PK_19de798c033a710dcfa5c72f81b" TO "memory_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "move_history" RENAME CONSTRAINT "PK_af608f132233acf123f2949678d" TO "move_history_pkey";`.execute(db);
  await sql`ALTER TABLE "notification" RENAME CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" TO "notification_pkey";`.execute(db);
  await sql`ALTER TABLE "notification" RENAME CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" TO "notification_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "partner_audit" RENAME CONSTRAINT "PK_952b50217ff78198a7e380f0359" TO "partner_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "PK_f1cc8f73d16b367f426261a8736" TO "partner_pkey";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" TO "partner_sharedById_fkey";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" TO "partner_sharedWithId_fkey";`.execute(db);
  await sql`ALTER TABLE "person_audit" RENAME CONSTRAINT "PK_46c1ad23490b9312ffaa052aa59" TO "person_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "PK_48cb6b5c20faa63157b3c1baf7f" TO "session_pkey";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" TO "session_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "FK_afbbabbd7daf5b91de4dca84de8" TO "session_parentId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "PK_642e2b0f619e4876e5f90a43465" TO "shared_link_pkey";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340" TO "shared_link_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66" TO "shared_link_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "UQ_sharedlink_key" TO "shared_link_key_uq";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3" TO "shared_link_asset_pkey";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66" TO "shared_link_asset_assetsId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab" TO "shared_link_asset_sharedLinksId_fkey";`.execute(db);
  await sql`ALTER TABLE "stack_audit" RENAME CONSTRAINT "PK_dbe4ec648fa032e8973297de07e" TO "stack_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" RENAME CONSTRAINT "PK_b846ab547a702863ef7cd9412fb" TO "session_sync_checkpoint_pkey";`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" RENAME CONSTRAINT "FK_d8ddd9d687816cc490432b3d4bc" TO "session_sync_checkpoint_sessionId_fkey";`.execute(db);
  await sql`ALTER TABLE "system_metadata" RENAME CONSTRAINT "PK_fa94f6857470fb5b81ec6084465" TO "system_metadata_pkey";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "PK_e7dc17249a1148a1970748eda99" TO "tag_pkey";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "FK_92e67dc508c705dd66c94615576" TO "tag_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "FK_9f9590cc11561f1f48ff034ef99" TO "tag_parentId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "UQ_79d6f16e52bb2c7130375246793" TO "tag_userId_value_uq";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "PK_ef5346fe522b5fb3bc96454747e" TO "tag_asset_pkey";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" TO "tag_asset_assetsId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42" TO "tag_asset_tagsId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "PK_eab38eb12a3ec6df8376c95477c" TO "tag_closure_pkey";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "FK_15fbcbc67663c6bfc07b354c22c" TO "tag_closure_id_ancestor_fkey";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "FK_b1a2a7ed45c29179b5ad51548a1" TO "tag_closure_id_descendant_fkey";`.execute(db);
  await sql`ALTER TABLE "user_audit" RENAME CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180" TO "user_audit_pkey";`.execute(db);
  await sql`ALTER TABLE "user_metadata" RENAME CONSTRAINT "PK_5931462150b3438cbc83277fe5a" TO "user_metadata_pkey";`.execute(db);
  await sql`ALTER TABLE "user_metadata" RENAME CONSTRAINT "FK_6afb43681a21cf7815932bc38ac" TO "user_metadata_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "version_history" RENAME CONSTRAINT "PK_5db259cbb09ce82c0d13cfd1b23" TO "version_history_pkey";`.execute(db);
  await sql`ALTER INDEX "IDX_users_updated_at_asc_id_asc" RENAME TO "user_updatedAt_id_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_users_update_id" RENAME TO "user_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_0f6fc2fb195f24d19b0fb0d57c" RENAME TO "library_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_libraries_update_id" RENAME TO "library_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_c05079e542fd74de3b5ecb5c1c" RENAME TO "stack_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_91704e101438fd0653f582426d" RENAME TO "stack_primaryAssetId_idx";`.execute(db);
  await sql`ALTER INDEX "idx_local_date_time" RENAME TO "asset_localDateTime_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_9977c3c1de01c3d848039a6b90" RENAME TO "asset_libraryId_idx";`.execute(db);
  await sql`ALTER INDEX "UQ_assets_owner_library_checksum" RENAME TO "asset_ownerId_libraryId_checksum_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_asset_id_stackId" RENAME TO "asset_id_stackId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_f15d48fa3ea5e4bda05ca8ab20" RENAME TO "asset_stackId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_originalPath_libraryId" RENAME TO "asset_originalPath_libraryId_idx";`.execute(db);
  await sql`ALTER INDEX "idx_local_date_time_month" RENAME TO "asset_localDateTime_month_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_4d66e76dada1ca180f67a205dc" RENAME TO "asset_originalFileName_idx";`.execute(db);
  await sql`ALTER INDEX "idx_originalfilename_trigram" RENAME TO "asset_originalFilename_trigram_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_16294b83fa8c0149719a1f631e" RENAME TO "asset_livePhotoVideoId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_2c5ac0d6fb58b238fd2068de67" RENAME TO "asset_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "idx_asset_file_created_at" RENAME TO "asset_fileCreatedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_8d3efe36c0755849395e6ea866" RENAME TO "asset_checksum_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_assets_duplicateId" RENAME TO "asset_duplicateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_assets_update_id" RENAME TO "asset_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_albums_update_id" RENAME TO "album_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_b22c53f35ef20c28c21637c85f" RENAME TO "album_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_05895aa505a670300d4816debc" RENAME TO "album_albumThumbnailAssetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_assets_update_id" RENAME TO "album_asset_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_e590fa396c6898fcd4a50e4092" RENAME TO "album_asset_albumsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_4bd1303d199f4e72ccdf998c62" RENAME TO "album_asset_assetsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_activity_like" RENAME TO "activity_like_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_86102d85cfa7f196073aebff68" RENAME TO "activity_albumId_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_3571467bcbe021f66e2bdce96e" RENAME TO "activity_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_1af8519996fbfb3684b58df280" RENAME TO "activity_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_8091ea76b12338cb4428d33d78" RENAME TO "activity_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_activity_update_id" RENAME TO "activity_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_assets_audit_album_id" RENAME TO "album_asset_audit_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_assets_audit_deleted_at" RENAME TO "album_asset_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_assets_audit_asset_id" RENAME TO "album_asset_audit_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_albums_audit_deleted_at" RENAME TO "album_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_albums_audit_album_id" RENAME TO "album_audit_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_albums_audit_user_id" RENAME TO "album_audit_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_users_audit_user_id" RENAME TO "album_user_audit_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_users_audit_album_id" RENAME TO "album_user_audit_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_users_audit_deleted_at" RENAME TO "album_user_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_users_update_id" RENAME TO "album_user_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_album_users_create_id" RENAME TO "album_user_createId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_f48513bf9bccefd6ff3ad30bd0" RENAME TO "album_user_usersId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_427c350ad49bd3935a50baab73" RENAME TO "album_user_albumsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_6c2e267ae764a9413b863a2934" RENAME TO "api_key_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_api_keys_update_id" RENAME TO "api_key_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_assets_audit_asset_id" RENAME TO "asset_audit_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_assets_audit_deleted_at" RENAME TO "asset_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_assets_audit_owner_id" RENAME TO "asset_audit_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_asset_exif_update_id" RENAME TO "asset_exif_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "exif_city" RENAME TO "asset_exif_city_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_auto_stack_id" RENAME TO "asset_exif_autoStackId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_live_photo_cid" RENAME TO "asset_exif_livePhotoCID_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_person_update_id" RENAME TO "person_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_5527cc99f530a547093f9e577b" RENAME TO "person_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_2bbabe31656b6778c6b87b6102" RENAME TO "person_faceAssetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_bf339a24070dac7e71304ec530" RENAME TO "asset_face_personId_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_asset_faces_assetId_personId" RENAME TO "asset_face_assetId_personId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_asset_files_assetId" RENAME TO "asset_file_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_asset_files_update_id" RENAME TO "asset_file_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_ownerId_createdAt" RENAME TO "audit_ownerId_createdAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memories_update_id" RENAME TO "memory_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_575842846f0c28fa5da46c99b1" RENAME TO "memory_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memory_assets_audit_memory_id" RENAME TO "memory_asset_audit_memoryId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memory_assets_audit_asset_id" RENAME TO "memory_asset_audit_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memory_assets_audit_deleted_at" RENAME TO "memory_asset_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_6942ecf52d75d4273de19d2c16" RENAME TO "memory_asset_assetsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memory_assets_update_id" RENAME TO "memory_asset_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_984e5c9ab1f04d34538cd32334" RENAME TO "memory_asset_memoriesId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memories_audit_deleted_at" RENAME TO "memory_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memories_audit_user_id" RENAME TO "memory_audit_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_memories_audit_memory_id" RENAME TO "memory_audit_memoryId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_notifications_update_id" RENAME TO "notification_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_692a909ee0fa9383e7859f9b40" RENAME TO "notification_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_partners_audit_shared_with_id" RENAME TO "partner_audit_sharedWithId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_partners_audit_deleted_at" RENAME TO "partner_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_partners_audit_shared_by_id" RENAME TO "partner_audit_sharedById_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_d7e875c6c60e661723dbf372fd" RENAME TO "partner_sharedWithId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_partners_create_id" RENAME TO "partner_createId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_partners_update_id" RENAME TO "partner_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_person_audit_owner_id" RENAME TO "person_audit_ownerId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_person_audit_deleted_at" RENAME TO "person_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_person_audit_person_id" RENAME TO "person_audit_personId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_sessions_update_id" RENAME TO "session_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_57de40bc620f456c7311aa3a1e" RENAME TO "session_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_afbbabbd7daf5b91de4dca84de" RENAME TO "session_parentId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_sharedlink_key" RENAME TO "shared_link_key_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_sharedlink_albumId" RENAME TO "shared_link_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_66fe3837414c5a9f1c33ca4934" RENAME TO "shared_link_userId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_c9fab4aa97ffd1b034f3d6581a" RENAME TO "shared_link_asset_sharedLinksId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_5b7decce6c8d3db9593d6111a6" RENAME TO "shared_link_asset_assetsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_stacks_audit_deleted_at" RENAME TO "stack_audit_deletedAt_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_d8ddd9d687816cc490432b3d4b" RENAME TO "session_sync_checkpoint_sessionId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_session_sync_checkpoints_update_id" RENAME TO "session_sync_checkpoint_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_9f9590cc11561f1f48ff034ef9" RENAME TO "tag_parentId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_tags_update_id" RENAME TO "tag_updateId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_f8e8a9e893cb5c54907f1b798e" RENAME TO "tag_asset_assetsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_e99f31ea4cdf3a2c35c7287eb4" RENAME TO "tag_asset_tagsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_tag_asset_assetsId_tagsId" RENAME TO "tag_asset_assetsId_tagsId_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_15fbcbc67663c6bfc07b354c22" RENAME TO "tag_closure_id_ancestor_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_b1a2a7ed45c29179b5ad51548a" RENAME TO "tag_closure_id_descendant_idx";`.execute(db);
  await sql`ALTER INDEX "IDX_users_audit_deleted_at" RENAME TO "user_audit_deletedAt_idx";`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "user_delete_audit"
  AFTER DELETE ON "user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION user_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "user_updatedAt"
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "library_updatedAt"
  BEFORE UPDATE ON "library"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stack_delete_audit"
  AFTER DELETE ON "stack"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION stack_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stack_updatedAt"
  BEFORE UPDATE ON "stack"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_delete_audit"
  AFTER DELETE ON "asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_updatedAt"
  BEFORE UPDATE ON "asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_delete_audit"
  AFTER DELETE ON "album"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION album_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_updatedAt"
  BEFORE UPDATE ON "album"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_delete_audit"
  AFTER DELETE ON "album_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_asset_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_updatedAt"
  BEFORE UPDATE ON "album_asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "activity_updatedAt"
  BEFORE UPDATE ON "activity"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_delete_audit"
  AFTER DELETE ON "album_user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_user_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_updatedAt"
  BEFORE UPDATE ON "album_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "api_key_updatedAt"
  BEFORE UPDATE ON "api_key"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_exif_updatedAt"
  BEFORE UPDATE ON "asset_exif"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_updatedAt"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_file_updatedAt"
  BEFORE UPDATE ON "asset_file"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_delete_audit"
  AFTER DELETE ON "memory"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION memory_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_updatedAt"
  BEFORE UPDATE ON "memory"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_asset_delete_audit"
  AFTER DELETE ON "memory_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION memory_asset_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_asset_updatedAt"
  BEFORE UPDATE ON "memory_asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "notification_updatedAt"
  BEFORE UPDATE ON "notification"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partner_delete_audit"
  AFTER DELETE ON "partner"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION partner_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partner_updatedAt"
  BEFORE UPDATE ON "partner"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "session_updatedAt"
  BEFORE UPDATE ON "session"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "session_sync_checkpoint_updatedAt"
  BEFORE UPDATE ON "session_sync_checkpoint"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tag_updatedAt"
  BEFORE UPDATE ON "tag"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP FUNCTION users_delete_audit;`.execute(db);
  await sql`DROP FUNCTION partners_delete_audit;`.execute(db);
  await sql`DROP FUNCTION assets_delete_audit;`.execute(db);
  await sql`DROP FUNCTION albums_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_users_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_assets_delete_audit;`.execute(db);
  await sql`DROP FUNCTION memories_delete_audit;`.execute(db);
  await sql`DROP FUNCTION memory_assets_delete_audit;`.execute(db);
  await sql`DROP FUNCTION stacks_delete_audit;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_user_delete_audit', '{"type":"function","name":"user_delete_audit","sql":"CREATE OR REPLACE FUNCTION user_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO user_audit (\\"userId\\")\\n      SELECT \\"id\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_partner_delete_audit', '{"type":"function","name":"partner_delete_audit","sql":"CREATE OR REPLACE FUNCTION partner_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO partner_audit (\\"sharedById\\", \\"sharedWithId\\")\\n      SELECT \\"sharedById\\", \\"sharedWithId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_delete_audit', '{"type":"function","name":"asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_audit (\\"assetId\\", \\"ownerId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_delete_audit', '{"type":"function","name":"album_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_delete_audit', '{"type":"function","name":"album_asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_asset_audit (\\"albumId\\", \\"assetId\\")\\n      SELECT \\"albumsId\\", \\"assetsId\\" FROM OLD\\n      WHERE \\"albumsId\\" IN (SELECT \\"id\\" FROM album WHERE \\"id\\" IN (SELECT \\"albumsId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_user_delete_audit', '{"type":"function","name":"album_user_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_user_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"albumsId\\", \\"usersId\\"\\n      FROM OLD;\\n\\n      IF pg_trigger_depth() = 1 THEN\\n        INSERT INTO album_user_audit (\\"albumId\\", \\"userId\\")\\n        SELECT \\"albumsId\\", \\"usersId\\"\\n        FROM OLD;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_memory_delete_audit', '{"type":"function","name":"memory_delete_audit","sql":"CREATE OR REPLACE FUNCTION memory_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO memory_audit (\\"memoryId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_memory_asset_delete_audit', '{"type":"function","name":"memory_asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION memory_asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO memory_asset_audit (\\"memoryId\\", \\"assetId\\")\\n      SELECT \\"memoriesId\\", \\"assetsId\\" FROM OLD\\n      WHERE \\"memoriesId\\" IN (SELECT \\"id\\" FROM memory WHERE \\"id\\" IN (SELECT \\"memoriesId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_stack_delete_audit', '{"type":"function","name":"stack_delete_audit","sql":"CREATE OR REPLACE FUNCTION stack_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO stack_audit (\\"stackId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_user_delete_audit', '{"type":"trigger","name":"user_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"user_delete_audit\\"\\n  AFTER DELETE ON \\"user\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION user_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_user_updatedAt', '{"type":"trigger","name":"user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"user_updatedAt\\"\\n  BEFORE UPDATE ON \\"user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_library_updatedAt', '{"type":"trigger","name":"library_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"library_updatedAt\\"\\n  BEFORE UPDATE ON \\"library\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_stack_delete_audit', '{"type":"trigger","name":"stack_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"stack_delete_audit\\"\\n  AFTER DELETE ON \\"stack\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION stack_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_stack_updatedAt', '{"type":"trigger","name":"stack_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"stack_updatedAt\\"\\n  BEFORE UPDATE ON \\"stack\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_delete_audit', '{"type":"trigger","name":"asset_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_delete_audit\\"\\n  AFTER DELETE ON \\"asset\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_updatedAt', '{"type":"trigger","name":"asset_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_originalFilename_trigram_idx', '{"type":"index","name":"asset_originalFilename_trigram_idx","sql":"CREATE INDEX \\"asset_originalFilename_trigram_idx\\" ON \\"asset\\" USING gin (f_unaccent(\\"originalFileName\\") gin_trgm_ops);"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_localDateTime_month_idx', '{"type":"index","name":"asset_localDateTime_month_idx","sql":"CREATE INDEX \\"asset_localDateTime_month_idx\\" ON \\"asset\\" ((date_trunc(''MONTH''::text, (\\"localDateTime\\" AT TIME ZONE ''UTC''::text)) AT TIME ZONE ''UTC''::text));"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_localDateTime_idx', '{"type":"index","name":"asset_localDateTime_idx","sql":"CREATE INDEX \\"asset_localDateTime_idx\\" ON \\"asset\\" (((\\"localDateTime\\" at time zone ''UTC'')::date));"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_ownerId_libraryId_checksum_idx', '{"type":"index","name":"asset_ownerId_libraryId_checksum_idx","sql":"CREATE UNIQUE INDEX \\"asset_ownerId_libraryId_checksum_idx\\" ON \\"asset\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NOT NULL);"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_delete_audit', '{"type":"trigger","name":"album_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"album_delete_audit\\"\\n  AFTER DELETE ON \\"album\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION album_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_updatedAt', '{"type":"trigger","name":"album_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"album_updatedAt\\"\\n  BEFORE UPDATE ON \\"album\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_delete_audit', '{"type":"trigger","name":"album_asset_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_delete_audit\\"\\n  AFTER DELETE ON \\"album_asset\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_asset_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_updatedAt', '{"type":"trigger","name":"album_asset_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_updatedAt\\"\\n  BEFORE UPDATE ON \\"album_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_activity_updatedAt', '{"type":"trigger","name":"activity_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"activity_updatedAt\\"\\n  BEFORE UPDATE ON \\"activity\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_activity_like_idx', '{"type":"index","name":"activity_like_idx","sql":"CREATE UNIQUE INDEX \\"activity_like_idx\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE (\\"isLiked\\" = true);"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_user_delete_audit', '{"type":"trigger","name":"album_user_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"album_user_delete_audit\\"\\n  AFTER DELETE ON \\"album_user\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_user_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_user_updatedAt', '{"type":"trigger","name":"album_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"album_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"album_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_api_key_updatedAt', '{"type":"trigger","name":"api_key_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"api_key_updatedAt\\"\\n  BEFORE UPDATE ON \\"api_key\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_exif_updatedAt', '{"type":"trigger","name":"asset_exif_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_exif_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_exif\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_updatedAt', '{"type":"trigger","name":"person_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_updatedAt\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_file_updatedAt', '{"type":"trigger","name":"asset_file_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_file_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_file\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_delete_audit', '{"type":"trigger","name":"memory_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"memory_delete_audit\\"\\n  AFTER DELETE ON \\"memory\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION memory_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_updatedAt', '{"type":"trigger","name":"memory_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"memory_updatedAt\\"\\n  BEFORE UPDATE ON \\"memory\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_asset_delete_audit', '{"type":"trigger","name":"memory_asset_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"memory_asset_delete_audit\\"\\n  AFTER DELETE ON \\"memory_asset\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION memory_asset_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_asset_updatedAt', '{"type":"trigger","name":"memory_asset_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"memory_asset_updatedAt\\"\\n  BEFORE UPDATE ON \\"memory_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_notification_updatedAt', '{"type":"trigger","name":"notification_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"notification_updatedAt\\"\\n  BEFORE UPDATE ON \\"notification\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_partner_delete_audit', '{"type":"trigger","name":"partner_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"partner_delete_audit\\"\\n  AFTER DELETE ON \\"partner\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION partner_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_partner_updatedAt', '{"type":"trigger","name":"partner_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"partner_updatedAt\\"\\n  BEFORE UPDATE ON \\"partner\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_session_updatedAt', '{"type":"trigger","name":"session_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"session_updatedAt\\"\\n  BEFORE UPDATE ON \\"session\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_session_sync_checkpoint_updatedAt', '{"type":"trigger","name":"session_sync_checkpoint_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"session_sync_checkpoint_updatedAt\\"\\n  BEFORE UPDATE ON \\"session_sync_checkpoint\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_tag_updatedAt', '{"type":"trigger","name":"tag_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"tag_updatedAt\\"\\n  BEFORE UPDATE ON \\"tag\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_user_after_insert","sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT DISTINCT \\"albumsId\\" FROM inserted_rows);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"UQ_assets_owner_checksum","sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"asset\\" (\\"ownerId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NULL);"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"album_user_after_insert","sql":"CREATE OR REPLACE TRIGGER \\"album_user_after_insert\\"\\n  AFTER INSERT ON \\"album_user\\"\\n  REFERENCING NEW TABLE AS \\"inserted_rows\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION album_user_after_insert();"}'::jsonb WHERE "name" = 'trigger_album_user_after_insert';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_users_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_partners_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_albums_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_users_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_memories_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_memory_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_stacks_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_users_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_users_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_libraries_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_stacks_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_stacks_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_assets_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_albums_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_albums_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_activity_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_assets_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_users_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_users_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_api_keys_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_files_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_exif_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memories_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memories_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_assets_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_assets_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_notifications_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_partners_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_partners_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_sessions_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_session_sync_checkpoints_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_tags_updated_at';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_originalfilename_trigram';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_local_date_time_month';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_local_date_time';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_UQ_assets_owner_library_checksum';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_activity_like';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const { oldName, newName } of tables) {
    await sql.raw(`ALTER TABLE "${newName}" RENAME TO "${oldName}"`).execute(db);
  }
  await sql`CREATE OR REPLACE FUNCTION public.album_user_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE albums SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumsId" FROM inserted_rows);
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.users_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO users_audit ("userId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END;
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.partners_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO partners_audit ("sharedById", "sharedWithId")
      SELECT "sharedById", "sharedWithId"
      FROM OLD;
      RETURN NULL;
    END;
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.assets_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO assets_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END;
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.albums_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.album_users_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "albumsId", "usersId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_users_audit ("albumId", "userId")
        SELECT "albumsId", "usersId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.album_assets_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO album_assets_audit ("albumId", "assetId")
      SELECT "albumsId", "assetsId" FROM OLD
      WHERE "albumsId" IN (SELECT "id" FROM albums WHERE "id" IN (SELECT "albumsId" FROM OLD));
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.memories_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO memories_audit ("memoryId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.memory_assets_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO memory_assets_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetsId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memories WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.stacks_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO stacks_audit ("stackId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`DROP TRIGGER "activity_updatedAt" ON "activity";`.execute(db);
  await sql`DROP TRIGGER "person_updatedAt" ON "person";`.execute(db);
  await sql`DROP TRIGGER "album_asset_delete_audit" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "album_asset_updatedAt" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "album_user_delete_audit" ON "album_user";`.execute(db);
  await sql`DROP TRIGGER "album_user_updatedAt" ON "album_user";`.execute(db);
  await sql`DROP TRIGGER "album_delete_audit" ON "album";`.execute(db);
  await sql`DROP TRIGGER "album_updatedAt" ON "album";`.execute(db);
  await sql`DROP TRIGGER "api_key_updatedAt" ON "api_key";`.execute(db);
  await sql`DROP TRIGGER "asset_delete_audit" ON "asset";`.execute(db);
  await sql`DROP TRIGGER "asset_updatedAt" ON "asset";`.execute(db);
  await sql`DROP TRIGGER "asset_file_updatedAt" ON "asset_file";`.execute(db);
  await sql`DROP TRIGGER "asset_exif_updatedAt" ON "asset_exif";`.execute(db);
  await sql`DROP TRIGGER "library_updatedAt" ON "library";`.execute(db);
  await sql`DROP TRIGGER "memory_asset_delete_audit" ON "memory_asset";`.execute(db);
  await sql`DROP TRIGGER "memory_asset_updatedAt" ON "memory_asset";`.execute(db);
  await sql`DROP TRIGGER "memory_delete_audit" ON "memory";`.execute(db);
  await sql`DROP TRIGGER "memory_updatedAt" ON "memory";`.execute(db);
  await sql`DROP TRIGGER "notification_updatedAt" ON "notification";`.execute(db);
  await sql`DROP TRIGGER "partner_delete_audit" ON "partner";`.execute(db);
  await sql`DROP TRIGGER "partner_updatedAt" ON "partner";`.execute(db);
  await sql`DROP TRIGGER "session_updatedAt" ON "session";`.execute(db);
  await sql`DROP TRIGGER "stack_delete_audit" ON "stack";`.execute(db);
  await sql`DROP TRIGGER "stack_updatedAt" ON "stack";`.execute(db);
  await sql`DROP TRIGGER "session_sync_checkpoint_updatedAt" ON "session_sync_checkpoint";`.execute(db);
  await sql`DROP TRIGGER "tag_updatedAt" ON "tag";`.execute(db);
  await sql`DROP TRIGGER "user_delete_audit" ON "user";`.execute(db);
  await sql`DROP TRIGGER "user_updatedAt" ON "user";`.execute(db);
  await sql`ALTER TABLE "asset_audit" RENAME CONSTRAINT "asset_audit_pkey" TO "PK_99bd5c015f81a641927a32b4212";`.execute(db);
  await sql`ALTER TABLE "audit" RENAME CONSTRAINT "audit_pkey" TO "PK_1d3d120ddaf7bc9b1ed68ed463a";`.execute(db);
  await sql`ALTER TABLE "move_history" RENAME CONSTRAINT "move_history_pkey" TO "PK_af608f132233acf123f2949678d";`.execute(db);
  await sql`ALTER TABLE "partner_audit" RENAME CONSTRAINT "partner_audit_pkey" TO "PK_952b50217ff78198a7e380f0359";`.execute(db);
  await sql`ALTER TABLE "user_audit" RENAME CONSTRAINT "user_audit_pkey" TO "PK_e9b2bdfd90e7eb5961091175180";`.execute(db);
  await sql`ALTER TABLE "system_metadata" RENAME CONSTRAINT "system_metadata_pkey" TO "PK_fa94f6857470fb5b81ec6084465";`.execute(db);
  await sql`ALTER TABLE "version_history" RENAME CONSTRAINT "version_history_pkey" TO "PK_5db259cbb09ce82c0d13cfd1b23";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" RENAME CONSTRAINT "asset_job_status_assetId_fkey" TO "FK_420bec36fc02813bddf5c8b73d4";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" RENAME CONSTRAINT "asset_job_status_pkey" TO "PK_420bec36fc02813bddf5c8b73d4";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "tag_asset_assetsId_fkey" TO "FK_f8e8a9e893cb5c54907f1b798e9";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "tag_asset_tagsId_fkey" TO "FK_e99f31ea4cdf3a2c35c7287eb42";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "tag_asset_pkey" TO "PK_ef5346fe522b5fb3bc96454747e";`.execute(db);
  await sql`ALTER TABLE "user_metadata" RENAME CONSTRAINT "user_metadata_userId_fkey" TO "FK_6afb43681a21cf7815932bc38ac";`.execute(db);
  await sql`ALTER TABLE "user_metadata" RENAME CONSTRAINT "user_metadata_pkey" TO "PK_5931462150b3438cbc83277fe5a";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_albumId_fkey" TO "FK_1af8519996fbfb3684b58df280b";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_userId_fkey" TO "FK_3571467bcbe021f66e2bdce96ea";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_assetId_fkey" TO "FK_8091ea76b12338cb4428d33d782";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_albumId_assetId_fkey" TO "fk_activity_album_asset_composite";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_like_check" TO "CHK_2ab1e70f113f450eb40c1e3ec8";`.execute(db);
  await sql`ALTER TABLE "activity" RENAME CONSTRAINT "activity_pkey" TO "PK_24625a1d6b1b089c8ae206fe467";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "person_ownerId_fkey" TO "FK_5527cc99f530a547093f9e577b6";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "person_faceAssetId_fkey" TO "FK_2bbabe31656b6778c6b87b61023";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "person_birthDate_chk" TO "CHK_b0f82b0ed662bfc24fbb58bb45";`.execute(db);
  await sql`ALTER TABLE "person" RENAME CONSTRAINT "person_pkey" TO "PK_5fdaf670315c4b7e70cce85daa3";`.execute(db);
  await sql`ALTER TABLE "person_audit" RENAME CONSTRAINT "person_audit_pkey" TO "PK_46c1ad23490b9312ffaa052aa59";`.execute(db);
  await sql`ALTER TABLE "album_asset_audit" RENAME CONSTRAINT "album_asset_audit_albumId_fkey" TO "FK_8047b44b812619a3c75a2839b0d";`.execute(db);
  await sql`ALTER TABLE "album_asset_audit" RENAME CONSTRAINT "album_asset_audit_pkey" TO "PK_32969b576ec8f78d84f37c2eb2d";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "album_asset_albumsId_fkey" TO "FK_e590fa396c6898fcd4a50e40927";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "album_asset_assetsId_fkey" TO "FK_4bd1303d199f4e72ccdf998c621";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "album_asset_pkey" TO "PK_c67bc36fa845fb7b18e0e398180";`.execute(db);
  await sql`ALTER TABLE "album_audit" RENAME CONSTRAINT "album_audit_pkey" TO "PK_c75efea8d4dce316ad29b851a8b";`.execute(db);
  await sql`ALTER TABLE "album_user_audit" RENAME CONSTRAINT "album_user_audit_pkey" TO "PK_f479a2e575b7ebc9698362c1688";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "album_user_albumsId_fkey" TO "FK_427c350ad49bd3935a50baab737";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "album_user_usersId_fkey" TO "FK_f48513bf9bccefd6ff3ad30bd06";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "album_user_pkey" TO "PK_7df55657e0b2e8b626330a0ebc8";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "album_ownerId_fkey" TO "FK_b22c53f35ef20c28c21637c85f4";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "album_albumThumbnailAssetId_fkey" TO "FK_05895aa505a670300d4816debce";`.execute(db);
  await sql`ALTER TABLE "album" RENAME CONSTRAINT "album_pkey" TO "PK_7f71c7b5bc7c87b8f94c9a93a00";`.execute(db);
  await sql`ALTER TABLE "api_key" RENAME CONSTRAINT "api_key_userId_fkey" TO "FK_6c2e267ae764a9413b863a29342";`.execute(db);
  await sql`ALTER TABLE "api_key" RENAME CONSTRAINT "api_key_pkey" TO "PK_5c8a79801b44bd27b79228e1dad";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "asset_ownerId_fkey" TO "FK_2c5ac0d6fb58b238fd2068de67d";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "asset_livePhotoVideoId_fkey" TO "FK_16294b83fa8c0149719a1f631ef";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "asset_libraryId_fkey" TO "FK_9977c3c1de01c3d848039a6b90c";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "asset_stackId_fkey" TO "FK_f15d48fa3ea5e4bda05ca8ab207";`.execute(db);
  await sql`ALTER TABLE "asset" RENAME CONSTRAINT "asset_pkey" TO "PK_da96729a8b113377cfb6a62439c";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "asset_face_assetId_fkey" TO "FK_02a43fd0b3c50fb6d7f0cb7282c";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "asset_face_personId_fkey" TO "FK_95ad7106dd7b484275443f580f9";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME CONSTRAINT "asset_face_pkey" TO "PK_6df76ab2eb6f5b57b7c2f1fc684";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "asset_file_assetId_fkey" TO "FK_e3e103a5f1d8bc8402999286040";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "asset_file_assetId_type_uq" TO "UQ_assetId_type";`.execute(db);
  await sql`ALTER TABLE "asset_file" RENAME CONSTRAINT "asset_file_pkey" TO "PK_c41dc3e9ef5e1c57ca5a08a0004";`.execute(db);
  await sql`ALTER TABLE "asset_exif" RENAME CONSTRAINT "asset_exif_assetId_fkey" TO "FK_c0117fdbc50b917ef9067740c44";`.execute(db);
  await sql`ALTER TABLE "asset_exif" RENAME CONSTRAINT "asset_exif_pkey" TO "PK_c0117fdbc50b917ef9067740c44";`.execute(db);
  await sql`ALTER TABLE "library" RENAME CONSTRAINT "library_ownerId_fkey" TO "FK_0f6fc2fb195f24d19b0fb0d57c1";`.execute(db);
  await sql`ALTER TABLE "library" RENAME CONSTRAINT "library_pkey" TO "PK_505fedfcad00a09b3734b4223de";`.execute(db);
  await sql`ALTER TABLE "memory_asset_audit" RENAME CONSTRAINT "memory_asset_audit_memoryId_fkey" TO "FK_225a204afcb0bd6de015080fb03";`.execute(db);
  await sql`ALTER TABLE "memory_asset_audit" RENAME CONSTRAINT "memory_asset_audit_pkey" TO "PK_35ef16910228f980e0766dcc59b";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "memory_asset_memoriesId_fkey" TO "FK_984e5c9ab1f04d34538cd32334e";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "memory_asset_assetsId_fkey" TO "FK_6942ecf52d75d4273de19d2c16f";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "memory_asset_pkey" TO "PK_fcaf7112a013d1703c011c6793d";`.execute(db);
  await sql`ALTER TABLE "memory_audit" RENAME CONSTRAINT "memory_audit_pkey" TO "PK_19de798c033a710dcfa5c72f81b";`.execute(db);
  await sql`ALTER TABLE "memory" RENAME CONSTRAINT "memory_ownerId_fkey" TO "FK_575842846f0c28fa5da46c99b19";`.execute(db);
  await sql`ALTER TABLE "memory" RENAME CONSTRAINT "memory_pkey" TO "PK_aaa0692d9496fe827b0568612f8";`.execute(db);
  await sql`ALTER TABLE "notification" RENAME CONSTRAINT "notification_userId_fkey" TO "FK_692a909ee0fa9383e7859f9b406";`.execute(db);
  await sql`ALTER TABLE "notification" RENAME CONSTRAINT "notification_pkey" TO "PK_6a72c3c0f683f6462415e653c3a";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "partner_sharedById_fkey" TO "FK_7e077a8b70b3530138610ff5e04";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "partner_sharedWithId_fkey" TO "FK_d7e875c6c60e661723dbf372fd3";`.execute(db);
  await sql`ALTER TABLE "partner" RENAME CONSTRAINT "partner_pkey" TO "PK_f1cc8f73d16b367f426261a8736";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "session_userId_fkey" TO "FK_57de40bc620f456c7311aa3a1e6";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "session_parentId_fkey" TO "FK_afbbabbd7daf5b91de4dca84de8";`.execute(db);
  await sql`ALTER TABLE "session" RENAME CONSTRAINT "session_pkey" TO "PK_48cb6b5c20faa63157b3c1baf7f";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "shared_link_asset_assetsId_fkey" TO "FK_5b7decce6c8d3db9593d6111a66";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "shared_link_asset_sharedLinksId_fkey" TO "FK_c9fab4aa97ffd1b034f3d6581ab";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "shared_link_asset_pkey" TO "PK_9b4f3687f9b31d1e311336b05e3";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "shared_link_userId_fkey" TO "FK_66fe3837414c5a9f1c33ca49340";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "shared_link_albumId_fkey" TO "FK_0c6ce9058c29f07cdf7014eac66";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "shared_link_key_uq" TO "UQ_sharedlink_key";`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "shared_link_pkey" TO "PK_642e2b0f619e4876e5f90a43465";`.execute(db);
  await sql`ALTER TABLE "stack_audit" RENAME CONSTRAINT "stack_audit_pkey" TO "PK_dbe4ec648fa032e8973297de07e";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "stack_primaryAssetId_fkey" TO "FK_91704e101438fd0653f582426dc";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "stack_primaryAssetId_uq" TO "REL_91704e101438fd0653f582426d";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "stack_ownerId_fkey" TO "FK_c05079e542fd74de3b5ecb5c1c8";`.execute(db);
  await sql`ALTER TABLE "stack" RENAME CONSTRAINT "stack_pkey" TO "PK_74a27e7fcbd5852463d0af3034b";`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" RENAME CONSTRAINT "session_sync_checkpoint_sessionId_fkey" TO "FK_d8ddd9d687816cc490432b3d4bc";`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" RENAME CONSTRAINT "session_sync_checkpoint_pkey" TO "PK_b846ab547a702863ef7cd9412fb";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "tag_closure_id_ancestor_fkey" TO "FK_15fbcbc67663c6bfc07b354c22c";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "tag_closure_id_descendant_fkey" TO "FK_b1a2a7ed45c29179b5ad51548a1";`.execute(db);
  await sql`ALTER TABLE "tag_closure" RENAME CONSTRAINT "tag_closure_pkey" TO "PK_eab38eb12a3ec6df8376c95477c";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "tag_userId_fkey" TO "FK_92e67dc508c705dd66c94615576";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "tag_parentId_fkey" TO "FK_9f9590cc11561f1f48ff034ef99";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "tag_userId_value_uq" TO "UQ_79d6f16e52bb2c7130375246793";`.execute(db);
  await sql`ALTER TABLE "tag" RENAME CONSTRAINT "tag_pkey" TO "PK_e7dc17249a1148a1970748eda99";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "user_email_uq" TO "UQ_97672ac88f789774dd47f7c8be3";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "user_storageLabel_uq" TO "UQ_b309cf34fa58137c416b32cea3a";`.execute(db);
  await sql`ALTER TABLE "user" RENAME CONSTRAINT "user_pkey" TO "PK_a3ffb1c0c8416b9fc6f907b7433";`.execute(db);
  await sql`ALTER TABLE "user_metadata_audit" RENAME CONSTRAINT "user_metadata_audit_pkey" TO "PK_15d5cc4d65ac966233b9921acac";`.execute(db);
  await sql`ALTER INDEX "asset_audit_assetId_idx" RENAME TO "IDX_assets_audit_asset_id";`.execute(db);
  await sql`ALTER INDEX "asset_audit_ownerId_idx" RENAME TO "IDX_assets_audit_owner_id";`.execute(db);
  await sql`ALTER INDEX "asset_audit_deletedAt_idx" RENAME TO "IDX_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "audit_ownerId_createdAt_idx" RENAME TO "IDX_ownerId_createdAt";`.execute(db);
  await sql`ALTER INDEX "partner_audit_sharedById_idx" RENAME TO "IDX_partners_audit_shared_by_id";`.execute(db);
  await sql`ALTER INDEX "partner_audit_sharedWithId_idx" RENAME TO "IDX_partners_audit_shared_with_id";`.execute(db);
  await sql`ALTER INDEX "partner_audit_deletedAt_idx" RENAME TO "IDX_partners_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "user_audit_deletedAt_idx" RENAME TO "IDX_users_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "tag_asset_assetsId_tagsId_idx" RENAME TO "IDX_tag_asset_assetsId_tagsId";`.execute(db);
  await sql`ALTER INDEX "tag_asset_assetsId_idx" RENAME TO "IDX_f8e8a9e893cb5c54907f1b798e";`.execute(db);
  await sql`ALTER INDEX "tag_asset_tagsId_idx" RENAME TO "IDX_e99f31ea4cdf3a2c35c7287eb4";`.execute(db);
  await sql`ALTER INDEX "activity_albumId_assetId_idx" RENAME TO "IDX_86102d85cfa7f196073aebff68";`.execute(db);
  await sql`ALTER INDEX "activity_like_idx" RENAME TO "IDX_activity_like";`.execute(db);
  await sql`ALTER INDEX "activity_albumId_idx" RENAME TO "IDX_1af8519996fbfb3684b58df280";`.execute(db);
  await sql`ALTER INDEX "activity_userId_idx" RENAME TO "IDX_3571467bcbe021f66e2bdce96e";`.execute(db);
  await sql`ALTER INDEX "activity_assetId_idx" RENAME TO "IDX_8091ea76b12338cb4428d33d78";`.execute(db);
  await sql`ALTER INDEX "activity_updateId_idx" RENAME TO "IDX_activity_update_id";`.execute(db);
  await sql`ALTER INDEX "person_ownerId_idx" RENAME TO "IDX_5527cc99f530a547093f9e577b";`.execute(db);
  await sql`ALTER INDEX "person_faceAssetId_idx" RENAME TO "IDX_2bbabe31656b6778c6b87b6102";`.execute(db);
  await sql`ALTER INDEX "person_updateId_idx" RENAME TO "IDX_person_update_id";`.execute(db);
  await sql`ALTER INDEX "person_audit_personId_idx" RENAME TO "IDX_person_audit_person_id";`.execute(db);
  await sql`ALTER INDEX "person_audit_ownerId_idx" RENAME TO "IDX_person_audit_owner_id";`.execute(db);
  await sql`ALTER INDEX "person_audit_deletedAt_idx" RENAME TO "IDX_person_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "album_asset_audit_albumId_idx" RENAME TO "IDX_album_assets_audit_album_id";`.execute(db);
  await sql`ALTER INDEX "album_asset_audit_assetId_idx" RENAME TO "IDX_album_assets_audit_asset_id";`.execute(db);
  await sql`ALTER INDEX "album_asset_audit_deletedAt_idx" RENAME TO "IDX_album_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "album_asset_albumsId_idx" RENAME TO "IDX_e590fa396c6898fcd4a50e4092";`.execute(db);
  await sql`ALTER INDEX "album_asset_assetsId_idx" RENAME TO "IDX_4bd1303d199f4e72ccdf998c62";`.execute(db);
  await sql`ALTER INDEX "album_asset_updateId_idx" RENAME TO "IDX_album_assets_update_id";`.execute(db);
  await sql`ALTER INDEX "album_audit_albumId_idx" RENAME TO "IDX_albums_audit_album_id";`.execute(db);
  await sql`ALTER INDEX "album_audit_userId_idx" RENAME TO "IDX_albums_audit_user_id";`.execute(db);
  await sql`ALTER INDEX "album_audit_deletedAt_idx" RENAME TO "IDX_albums_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "album_user_audit_albumId_idx" RENAME TO "IDX_album_users_audit_album_id";`.execute(db);
  await sql`ALTER INDEX "album_user_audit_userId_idx" RENAME TO "IDX_album_users_audit_user_id";`.execute(db);
  await sql`ALTER INDEX "album_user_audit_deletedAt_idx" RENAME TO "IDX_album_users_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "album_user_albumsId_idx" RENAME TO "IDX_427c350ad49bd3935a50baab73";`.execute(db);
  await sql`ALTER INDEX "album_user_usersId_idx" RENAME TO "IDX_f48513bf9bccefd6ff3ad30bd0";`.execute(db);
  await sql`ALTER INDEX "album_user_createId_idx" RENAME TO "IDX_album_users_create_id";`.execute(db);
  await sql`ALTER INDEX "album_user_updateId_idx" RENAME TO "IDX_album_users_update_id";`.execute(db);
  await sql`ALTER INDEX "album_ownerId_idx" RENAME TO "IDX_b22c53f35ef20c28c21637c85f";`.execute(db);
  await sql`ALTER INDEX "album_albumThumbnailAssetId_idx" RENAME TO "IDX_05895aa505a670300d4816debc";`.execute(db);
  await sql`ALTER INDEX "album_updateId_idx" RENAME TO "IDX_albums_update_id";`.execute(db);
  await sql`ALTER INDEX "api_key_userId_idx" RENAME TO "IDX_6c2e267ae764a9413b863a2934";`.execute(db);
  await sql`ALTER INDEX "api_key_updateId_idx" RENAME TO "IDX_api_keys_update_id";`.execute(db);
  await sql`ALTER INDEX "asset_originalFilename_trigram_idx" RENAME TO "idx_originalfilename_trigram";`.execute(db);
  await sql`ALTER INDEX "asset_id_stackId_idx" RENAME TO "IDX_asset_id_stackId";`.execute(db);
  await sql`ALTER INDEX "asset_originalPath_libraryId_idx" RENAME TO "IDX_originalPath_libraryId";`.execute(db);
  await sql`ALTER INDEX "asset_localDateTime_month_idx" RENAME TO "idx_local_date_time_month";`.execute(db);
  await sql`ALTER INDEX "asset_localDateTime_idx" RENAME TO "idx_local_date_time";`.execute(db);
  await sql`ALTER INDEX "asset_ownerId_libraryId_checksum_idx" RENAME TO "UQ_assets_owner_library_checksum";`.execute(db);
  await sql`ALTER INDEX "asset_ownerId_idx" RENAME TO "IDX_2c5ac0d6fb58b238fd2068de67";`.execute(db);
  await sql`ALTER INDEX "asset_fileCreatedAt_idx" RENAME TO "idx_asset_file_created_at";`.execute(db);
  await sql`ALTER INDEX "asset_checksum_idx" RENAME TO "IDX_8d3efe36c0755849395e6ea866";`.execute(db);
  await sql`ALTER INDEX "asset_livePhotoVideoId_idx" RENAME TO "IDX_16294b83fa8c0149719a1f631e";`.execute(db);
  await sql`ALTER INDEX "asset_originalFileName_idx" RENAME TO "IDX_4d66e76dada1ca180f67a205dc";`.execute(db);
  await sql`ALTER INDEX "asset_libraryId_idx" RENAME TO "IDX_9977c3c1de01c3d848039a6b90";`.execute(db);
  await sql`ALTER INDEX "asset_stackId_idx" RENAME TO "IDX_f15d48fa3ea5e4bda05ca8ab20";`.execute(db);
  await sql`ALTER INDEX "asset_duplicateId_idx" RENAME TO "IDX_assets_duplicateId";`.execute(db);
  await sql`ALTER INDEX "asset_updateId_idx" RENAME TO "IDX_assets_update_id";`.execute(db);
  await sql`ALTER INDEX "asset_face_assetId_personId_idx" RENAME TO "IDX_asset_faces_assetId_personId";`.execute(db);
  await sql`ALTER INDEX "asset_file_assetId_idx" RENAME TO "IDX_asset_files_assetId";`.execute(db);
  await sql`ALTER INDEX "asset_file_updateId_idx" RENAME TO "IDX_asset_files_update_id";`.execute(db);
  await sql`ALTER INDEX "asset_exif_city_idx" RENAME TO "exif_city";`.execute(db);
  await sql`ALTER INDEX "asset_exif_livePhotoCID_idx" RENAME TO "IDX_live_photo_cid";`.execute(db);
  await sql`ALTER INDEX "asset_exif_autoStackId_idx" RENAME TO "IDX_auto_stack_id";`.execute(db);
  await sql`ALTER INDEX "asset_exif_updateId_idx" RENAME TO "IDX_asset_exif_update_id";`.execute(db);
  await sql`ALTER INDEX "library_ownerId_idx" RENAME TO "IDX_0f6fc2fb195f24d19b0fb0d57c";`.execute(db);
  await sql`ALTER INDEX "library_updateId_idx" RENAME TO "IDX_libraries_update_id";`.execute(db);
  await sql`ALTER INDEX "memory_asset_audit_memoryId_idx" RENAME TO "IDX_memory_assets_audit_memory_id";`.execute(db);
  await sql`ALTER INDEX "memory_asset_audit_assetId_idx" RENAME TO "IDX_memory_assets_audit_asset_id";`.execute(db);
  await sql`ALTER INDEX "memory_asset_audit_deletedAt_idx" RENAME TO "IDX_memory_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "memory_asset_memoriesId_idx" RENAME TO "IDX_984e5c9ab1f04d34538cd32334";`.execute(db);
  await sql`ALTER INDEX "memory_asset_assetsId_idx" RENAME TO "IDX_6942ecf52d75d4273de19d2c16";`.execute(db);
  await sql`ALTER INDEX "memory_asset_updateId_idx" RENAME TO "IDX_memory_assets_update_id";`.execute(db);
  await sql`ALTER INDEX "memory_audit_memoryId_idx" RENAME TO "IDX_memories_audit_memory_id";`.execute(db);
  await sql`ALTER INDEX "memory_audit_userId_idx" RENAME TO "IDX_memories_audit_user_id";`.execute(db);
  await sql`ALTER INDEX "memory_audit_deletedAt_idx" RENAME TO "IDX_memories_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "memory_ownerId_idx" RENAME TO "IDX_575842846f0c28fa5da46c99b1";`.execute(db);
  await sql`ALTER INDEX "memory_updateId_idx" RENAME TO "IDX_memories_update_id";`.execute(db);
  await sql`ALTER INDEX "notification_updateId_idx" RENAME TO "IDX_notifications_update_id";`.execute(db);
  await sql`ALTER INDEX "notification_userId_idx" RENAME TO "IDX_692a909ee0fa9383e7859f9b40";`.execute(db);
  await sql`ALTER INDEX "partner_sharedWithId_idx" RENAME TO "IDX_d7e875c6c60e661723dbf372fd";`.execute(db);
  await sql`ALTER INDEX "partner_createId_idx" RENAME TO "IDX_partners_create_id";`.execute(db);
  await sql`ALTER INDEX "partner_updateId_idx" RENAME TO "IDX_partners_update_id";`.execute(db);
  await sql`ALTER INDEX "session_userId_idx" RENAME TO "IDX_57de40bc620f456c7311aa3a1e";`.execute(db);
  await sql`ALTER INDEX "session_parentId_idx" RENAME TO "IDX_afbbabbd7daf5b91de4dca84de";`.execute(db);
  await sql`ALTER INDEX "session_updateId_idx" RENAME TO "IDX_sessions_update_id";`.execute(db);
  await sql`ALTER INDEX "shared_link_asset_assetsId_idx" RENAME TO "IDX_5b7decce6c8d3db9593d6111a6";`.execute(db);
  await sql`ALTER INDEX "shared_link_asset_sharedLinksId_idx" RENAME TO "IDX_c9fab4aa97ffd1b034f3d6581a";`.execute(db);
  await sql`ALTER INDEX "shared_link_userId_idx" RENAME TO "IDX_66fe3837414c5a9f1c33ca4934";`.execute(db);
  await sql`ALTER INDEX "shared_link_key_idx" RENAME TO "IDX_sharedlink_key";`.execute(db);
  await sql`ALTER INDEX "shared_link_albumId_idx" RENAME TO "IDX_sharedlink_albumId";`.execute(db);
  await sql`ALTER INDEX "stack_audit_deletedAt_idx" RENAME TO "IDX_stacks_audit_deleted_at";`.execute(db);
  await sql`ALTER INDEX "stack_primaryAssetId_idx" RENAME TO "IDX_91704e101438fd0653f582426d";`.execute(db);
  await sql`ALTER INDEX "stack_ownerId_idx" RENAME TO "IDX_c05079e542fd74de3b5ecb5c1c";`.execute(db);
  await sql`ALTER INDEX "session_sync_checkpoint_sessionId_idx" RENAME TO "IDX_d8ddd9d687816cc490432b3d4b";`.execute(db);
  await sql`ALTER INDEX "session_sync_checkpoint_updateId_idx" RENAME TO "IDX_session_sync_checkpoints_update_id";`.execute(db);
  await sql`ALTER INDEX "tag_closure_id_ancestor_idx" RENAME TO "IDX_15fbcbc67663c6bfc07b354c22";`.execute(db);
  await sql`ALTER INDEX "tag_closure_id_descendant_idx" RENAME TO "IDX_b1a2a7ed45c29179b5ad51548a";`.execute(db);
  await sql`ALTER INDEX "tag_parentId_idx" RENAME TO "IDX_9f9590cc11561f1f48ff034ef9";`.execute(db);
  await sql`ALTER INDEX "tag_updateId_idx" RENAME TO "IDX_tags_update_id";`.execute(db);
  await sql`ALTER INDEX "user_updateId_idx" RENAME TO "IDX_users_update_id";`.execute(db);
  await sql`ALTER INDEX "user_updatedAt_id_idx" RENAME TO "IDX_users_updated_at_asc_id_asc";`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "activity_updated_at"
  BEFORE UPDATE ON "activity"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_updated_at"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_updated_at"
  BEFORE UPDATE ON "album_asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_delete_audit"
  AFTER DELETE ON "album_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() <= 1))
  EXECUTE FUNCTION album_assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_users_delete_audit"
  AFTER DELETE ON "album_user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() <= 1))
  EXECUTE FUNCTION album_users_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_users_updated_at"
  BEFORE UPDATE ON "album_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "albums_updated_at"
  BEFORE UPDATE ON "album"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "albums_delete_audit"
  AFTER DELETE ON "album"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION albums_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "api_keys_updated_at"
  BEFORE UPDATE ON "api_key"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "assets_delete_audit"
  AFTER DELETE ON "asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "assets_updated_at"
  BEFORE UPDATE ON "asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_files_updated_at"
  BEFORE UPDATE ON "asset_file"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_exif_updated_at"
  BEFORE UPDATE ON "asset_exif"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "libraries_updated_at"
  BEFORE UPDATE ON "library"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_assets_updated_at"
  BEFORE UPDATE ON "memory_asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_assets_delete_audit"
  AFTER DELETE ON "memory_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() <= 1))
  EXECUTE FUNCTION memory_assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memories_updated_at"
  BEFORE UPDATE ON "memory"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memories_delete_audit"
  AFTER DELETE ON "memory"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION memories_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "notifications_updated_at"
  BEFORE UPDATE ON "notification"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partners_delete_audit"
  AFTER DELETE ON "partner"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION partners_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partners_updated_at"
  BEFORE UPDATE ON "partner"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "sessions_updated_at"
  BEFORE UPDATE ON "session"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stacks_delete_audit"
  AFTER DELETE ON "stack"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION stacks_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stacks_updated_at"
  BEFORE UPDATE ON "stack"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "session_sync_checkpoints_updated_at"
  BEFORE UPDATE ON "session_sync_checkpoint"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tags_updated_at"
  BEFORE UPDATE ON "tag"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "users_delete_audit"
  AFTER DELETE ON "user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION users_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "users_updated_at"
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP FUNCTION user_delete_audit;`.execute(db);
  await sql`DROP FUNCTION partner_delete_audit;`.execute(db);
  await sql`DROP FUNCTION asset_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_asset_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_user_delete_audit;`.execute(db);
  await sql`DROP FUNCTION memory_delete_audit;`.execute(db);
  await sql`DROP FUNCTION memory_asset_delete_audit;`.execute(db);
  await sql`DROP FUNCTION stack_delete_audit;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_users_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION users_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO users_audit (\\"userId\\")\\n      SELECT \\"id\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"users_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_partners_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION partners_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO partners_audit (\\"sharedById\\", \\"sharedWithId\\")\\n      SELECT \\"sharedById\\", \\"sharedWithId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"partners_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_assets_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION assets_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO assets_audit (\\"assetId\\", \\"ownerId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"assets_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_albums_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION albums_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO albums_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"albums_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_assets_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION album_assets_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_assets_audit (\\"albumId\\", \\"assetId\\")\\n      SELECT \\"albumsId\\", \\"assetsId\\" FROM OLD\\n      WHERE \\"albumsId\\" IN (SELECT \\"id\\" FROM albums WHERE \\"id\\" IN (SELECT \\"albumsId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_assets_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_users_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION album_users_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO albums_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"albumsId\\", \\"usersId\\"\\n      FROM OLD;\\n\\n      IF pg_trigger_depth() = 1 THEN\\n        INSERT INTO album_users_audit (\\"albumId\\", \\"userId\\")\\n        SELECT \\"albumsId\\", \\"usersId\\"\\n        FROM OLD;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_users_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_memories_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION memories_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO memories_audit (\\"memoryId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"memories_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_memory_assets_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION memory_assets_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO memory_assets_audit (\\"memoryId\\", \\"assetId\\")\\n      SELECT \\"memoriesId\\", \\"assetsId\\" FROM OLD\\n      WHERE \\"memoriesId\\" IN (SELECT \\"id\\" FROM memories WHERE \\"id\\" IN (SELECT \\"memoriesId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;","name":"memory_assets_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_stacks_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION stacks_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO stacks_audit (\\"stackId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"stacks_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_users_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"users_delete_audit\\"\\n  AFTER DELETE ON \\"users\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION users_delete_audit();","name":"users_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_users_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"users_updated_at\\"\\n  BEFORE UPDATE ON \\"users\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"users_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_libraries_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"libraries_updated_at\\"\\n  BEFORE UPDATE ON \\"libraries\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"libraries_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_stacks_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"stacks_delete_audit\\"\\n  AFTER DELETE ON \\"asset_stack\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION stacks_delete_audit();","name":"stacks_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_stacks_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"stacks_updated_at\\"\\n  BEFORE UPDATE ON \\"asset_stack\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"stacks_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_assets_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"assets_delete_audit\\"\\n  AFTER DELETE ON \\"assets\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION assets_delete_audit();","name":"assets_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_assets_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"assets_updated_at\\"\\n  BEFORE UPDATE ON \\"assets\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"assets_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_albums_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"albums_delete_audit\\"\\n  AFTER DELETE ON \\"albums\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION albums_delete_audit();","name":"albums_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_albums_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"albums_updated_at\\"\\n  BEFORE UPDATE ON \\"albums\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"albums_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_activity_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"activity_updated_at\\"\\n  BEFORE UPDATE ON \\"activity\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"activity_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_assets_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_assets_delete_audit\\"\\n  AFTER DELETE ON \\"albums_assets_assets\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_assets_delete_audit();","name":"album_assets_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_assets_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_assets_updated_at\\"\\n  BEFORE UPDATE ON \\"albums_assets_assets\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"album_assets_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_users_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_users_delete_audit\\"\\n  AFTER DELETE ON \\"albums_shared_users_users\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_users_delete_audit();","name":"album_users_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_users_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_users_updated_at\\"\\n  BEFORE UPDATE ON \\"albums_shared_users_users\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"album_users_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_api_keys_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"api_keys_updated_at\\"\\n  BEFORE UPDATE ON \\"api_keys\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"api_keys_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"person_updated_at\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"person_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_files_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_files_updated_at\\"\\n  BEFORE UPDATE ON \\"asset_files\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"asset_files_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_exif_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_exif_updated_at\\"\\n  BEFORE UPDATE ON \\"exif\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"asset_exif_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memories_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"memories_delete_audit\\"\\n  AFTER DELETE ON \\"memories\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION memories_delete_audit();","name":"memories_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memories_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"memories_updated_at\\"\\n  BEFORE UPDATE ON \\"memories\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"memories_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_assets_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"memory_assets_delete_audit\\"\\n  AFTER DELETE ON \\"memories_assets_assets\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION memory_assets_delete_audit();","name":"memory_assets_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_memory_assets_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"memory_assets_updated_at\\"\\n  BEFORE UPDATE ON \\"memories_assets_assets\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"memory_assets_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_notifications_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"notifications_updated_at\\"\\n  BEFORE UPDATE ON \\"notifications\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"notifications_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_partners_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"partners_delete_audit\\"\\n  AFTER DELETE ON \\"partners\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION partners_delete_audit();","name":"partners_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_partners_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"partners_updated_at\\"\\n  BEFORE UPDATE ON \\"partners\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"partners_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_sessions_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"sessions_updated_at\\"\\n  BEFORE UPDATE ON \\"sessions\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"sessions_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_session_sync_checkpoints_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"session_sync_checkpoints_updated_at\\"\\n  BEFORE UPDATE ON \\"session_sync_checkpoints\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"session_sync_checkpoints_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_tags_updated_at', '{"sql":"CREATE OR REPLACE TRIGGER \\"tags_updated_at\\"\\n  BEFORE UPDATE ON \\"tags\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"tags_updated_at","type":"trigger"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_originalfilename_trigram', '{"sql":"CREATE INDEX \\"idx_originalfilename_trigram\\" ON \\"assets\\" USING gin (f_unaccent(\\"originalFileName\\") gin_trgm_ops);","name":"idx_originalfilename_trigram","type":"index"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_local_date_time_month', '{"sql":"CREATE INDEX \\"idx_local_date_time_month\\" ON \\"assets\\" ((date_trunc(''MONTH''::text, (\\"localDateTime\\" AT TIME ZONE ''UTC''::text)) AT TIME ZONE ''UTC''::text));","name":"idx_local_date_time_month","type":"index"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_local_date_time', '{"sql":"CREATE INDEX \\"idx_local_date_time\\" ON \\"assets\\" (((\\"localDateTime\\" at time zone ''UTC'')::date));","name":"idx_local_date_time","type":"index"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_UQ_assets_owner_library_checksum', '{"sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_library_checksum\\" ON \\"assets\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NOT NULL);","name":"UQ_assets_owner_library_checksum","type":"index"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_activity_like', '{"sql":"CREATE UNIQUE INDEX \\"IDX_activity_like\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE (\\"isLiked\\" = true);","name":"IDX_activity_like","type":"index"}'::jsonb);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE albums SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT DISTINCT \\"albumsId\\" FROM inserted_rows);\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_user_after_insert","type":"function"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"album_user_after_insert\\"\\n  AFTER INSERT ON \\"albums_shared_users_users\\"\\n  REFERENCING NEW TABLE AS \\"inserted_rows\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION album_user_after_insert();","name":"album_user_after_insert","type":"trigger"}'::jsonb WHERE "name" = 'trigger_album_user_after_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"assets\\" (\\"ownerId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NULL);","name":"UQ_assets_owner_checksum","type":"index"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_partner_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_memory_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_memory_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_stack_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_user_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_library_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_stack_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_stack_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_originalFilename_trigram_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_localDateTime_month_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_localDateTime_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_ownerId_libraryId_checksum_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_activity_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_activity_like_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_user_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_api_key_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_exif_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_file_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_memory_asset_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_notification_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_partner_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_partner_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_session_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_session_sync_checkpoint_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_tag_updatedAt';`.execute(db);


}
