import { Kysely, sql } from 'kysely';
import { DatabaseExtension } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { vectorIndexQuery } from 'src/utils/database';

const vectorExtension = new ConfigRepository().getEnv().database.vectorExtension;
const lastMigrationSql = sql<{ name: string }>`SELECT "name" FROM "migrations" ORDER BY "timestamp" DESC LIMIT 1;`;
const tableExists = sql<{ result: string | null }>`select to_regclass('migrations') as "result"`;
const logger = LoggingRepository.create();

export async function up(db: Kysely<any>): Promise<void> {
  const { rows } = await tableExists.execute(db);
  const hasTypeOrmMigrations = !!rows[0]?.result;
  if (hasTypeOrmMigrations) {
    const {
      rows: [lastMigration],
    } = await lastMigrationSql.execute(db);
    if (lastMigration?.name !== 'AddMissingIndex1744910873956') {
      throw new Error(
        'Invalid upgrade path. For more information, see https://immich.app/errors#typeorm-upgrade',
      );
    }
    logger.log('Database has up to date TypeORM migrations, skipping initial Kysely migration');
    return;
  }

  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "unaccent";`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "cube";`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "earthdistance";`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS ${sql.raw(vectorExtension)}`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION immich_uuid_v7(p_timestamp timestamp with time zone default clock_timestamp())
  RETURNS uuid
  VOLATILE LANGUAGE SQL
  AS $$
    select encode(
      set_bit(
        set_bit(
          overlay(uuid_send(gen_random_uuid())
                  placing substring(int8send(floor(extract(epoch from p_timestamp) * 1000)::bigint) from 3)
                  from 1 for 6
          ),
          52, 1
        ),
        53, 1
      ),
      'hex')::uuid;
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION updated_at()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    DECLARE
        clock_timestamp TIMESTAMP := clock_timestamp();
    BEGIN
        new."updatedAt" = clock_timestamp;
        new."updateId" = immich_uuid_v7(clock_timestamp);
        return new;
    END;
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION f_concat_ws(text, text[])
  RETURNS text
  PARALLEL SAFE IMMUTABLE LANGUAGE SQL
  AS $$SELECT array_to_string($2, $1)$$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text
  PARALLEL SAFE STRICT IMMUTABLE LANGUAGE SQL
    RETURN unaccent('unaccent', $1)`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION ll_to_earth_public(latitude double precision, longitude double precision)
  RETURNS public.earth
  PARALLEL SAFE STRICT IMMUTABLE LANGUAGE SQL
  AS $$
    SELECT public.cube(public.cube(public.cube(public.earth()*cos(radians(latitude))*cos(radians(longitude))),public.earth()*cos(radians(latitude))*sin(radians(longitude))),public.earth()*sin(radians(latitude)))::public.earth
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION users_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO users_audit ("userId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END;
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION partners_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO partners_audit ("sharedById", "sharedWithId")
      SELECT "sharedById", "sharedWithId"
      FROM OLD;
      RETURN NULL;
    END;
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION assets_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO assets_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END;
  $$;`.execute(db);
  if (vectorExtension === DatabaseExtension.VECTORS) {
    await sql`SET search_path TO "$user", public, vectors`.execute(db);
  }
  await sql`CREATE TYPE "assets_status_enum" AS ENUM ('active','trashed','deleted');`.execute(db);
  await sql`CREATE TYPE "sourcetype" AS ENUM ('machine-learning','exif','manual');`.execute(db);
  await sql`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL DEFAULT '', "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "profileImagePath" character varying NOT NULL DEFAULT '', "isAdmin" boolean NOT NULL DEFAULT false, "shouldChangePassword" boolean NOT NULL DEFAULT true, "deletedAt" timestamp with time zone, "oauthId" character varying NOT NULL DEFAULT '', "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "storageLabel" character varying, "name" character varying NOT NULL DEFAULT '', "quotaSizeInBytes" bigint, "quotaUsageInBytes" bigint NOT NULL DEFAULT 0, "status" character varying NOT NULL DEFAULT 'active', "profileChangedAt" timestamp with time zone NOT NULL DEFAULT now(), "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "libraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "importPaths" text[] NOT NULL, "exclusionPatterns" text[] NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "deletedAt" timestamp with time zone, "refreshedAt" timestamp with time zone, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "asset_stack" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "primaryAssetId" uuid NOT NULL, "ownerId" uuid NOT NULL);`.execute(db);
  await sql`CREATE TABLE "assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deviceAssetId" character varying NOT NULL, "ownerId" uuid NOT NULL, "deviceId" character varying NOT NULL, "type" character varying NOT NULL, "originalPath" character varying NOT NULL, "fileCreatedAt" timestamp with time zone NOT NULL, "fileModifiedAt" timestamp with time zone NOT NULL, "isFavorite" boolean NOT NULL DEFAULT false, "duration" character varying, "encodedVideoPath" character varying DEFAULT '', "checksum" bytea NOT NULL, "isVisible" boolean NOT NULL DEFAULT true, "livePhotoVideoId" uuid, "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "isArchived" boolean NOT NULL DEFAULT false, "originalFileName" character varying NOT NULL, "sidecarPath" character varying, "thumbhash" bytea, "isOffline" boolean NOT NULL DEFAULT false, "libraryId" uuid, "isExternal" boolean NOT NULL DEFAULT false, "deletedAt" timestamp with time zone, "localDateTime" timestamp with time zone NOT NULL, "stackId" uuid, "duplicateId" uuid, "status" assets_status_enum NOT NULL DEFAULT 'active', "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "albums" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "albumName" character varying NOT NULL DEFAULT 'Untitled Album', "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "albumThumbnailAssetId" uuid, "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "description" text NOT NULL DEFAULT '', "deletedAt" timestamp with time zone, "isActivityEnabled" boolean NOT NULL DEFAULT true, "order" character varying NOT NULL DEFAULT 'desc', "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`COMMENT ON COLUMN "albums"."albumThumbnailAssetId" IS 'Asset ID to be used as thumbnail';`.execute(db);
  await sql`CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "albumId" uuid NOT NULL, "userId" uuid NOT NULL, "assetId" uuid, "comment" text, "isLiked" boolean NOT NULL DEFAULT false, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "albums_assets_assets" ("albumsId" uuid NOT NULL, "assetsId" uuid NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now());`.execute(db);
  await sql`CREATE TABLE "albums_shared_users_users" ("albumsId" uuid NOT NULL, "usersId" uuid NOT NULL, "role" character varying NOT NULL DEFAULT 'editor');`.execute(db);
  await sql`CREATE TABLE "api_keys" ("name" character varying NOT NULL, "key" character varying NOT NULL, "userId" uuid NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permissions" character varying[] NOT NULL, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "assetId" uuid NOT NULL, "ownerId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`CREATE TABLE "person" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "ownerId" uuid NOT NULL, "name" character varying NOT NULL DEFAULT '', "thumbnailPath" character varying NOT NULL DEFAULT '', "isHidden" boolean NOT NULL DEFAULT false, "birthDate" date, "faceAssetId" uuid, "isFavorite" boolean NOT NULL DEFAULT false, "color" character varying, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "asset_faces" ("assetId" uuid NOT NULL, "personId" uuid, "imageWidth" integer NOT NULL DEFAULT 0, "imageHeight" integer NOT NULL DEFAULT 0, "boundingBoxX1" integer NOT NULL DEFAULT 0, "boundingBoxY1" integer NOT NULL DEFAULT 0, "boundingBoxX2" integer NOT NULL DEFAULT 0, "boundingBoxY2" integer NOT NULL DEFAULT 0, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceType" sourcetype NOT NULL DEFAULT 'machine-learning', "deletedAt" timestamp with time zone);`.execute(db);
  await sql`CREATE TABLE "asset_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "type" character varying NOT NULL, "path" character varying NOT NULL, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "asset_job_status" ("assetId" uuid NOT NULL, "facesRecognizedAt" timestamp with time zone, "metadataExtractedAt" timestamp with time zone, "duplicatesDetectedAt" timestamp with time zone, "previewAt" timestamp with time zone, "thumbnailAt" timestamp with time zone);`.execute(db);
  await sql`CREATE TABLE "audit" ("id" serial NOT NULL, "entityType" character varying NOT NULL, "entityId" uuid NOT NULL, "action" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now());`.execute(db);
  await sql`CREATE TABLE "exif" ("assetId" uuid NOT NULL, "make" character varying, "model" character varying, "exifImageWidth" integer, "exifImageHeight" integer, "fileSizeInByte" bigint, "orientation" character varying, "dateTimeOriginal" timestamp with time zone, "modifyDate" timestamp with time zone, "lensModel" character varying, "fNumber" double precision, "focalLength" double precision, "iso" integer, "latitude" double precision, "longitude" double precision, "city" character varying, "state" character varying, "country" character varying, "description" text NOT NULL DEFAULT '', "fps" double precision, "exposureTime" character varying, "livePhotoCID" character varying, "timeZone" character varying, "projectionType" character varying, "profileDescription" character varying, "colorspace" character varying, "bitsPerSample" integer, "autoStackId" character varying, "rating" integer, "updatedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(), "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "face_search" ("faceId" uuid NOT NULL, "embedding" vector(512) NOT NULL);`.execute(db);
  await sql`CREATE TABLE "geodata_places" ("id" integer NOT NULL, "name" character varying(200) NOT NULL, "longitude" double precision NOT NULL, "latitude" double precision NOT NULL, "countryCode" character(2) NOT NULL, "admin1Code" character varying(20), "admin2Code" character varying(80), "modificationDate" date NOT NULL, "admin1Name" character varying, "admin2Name" character varying, "alternateNames" character varying);`.execute(db);
  await sql`CREATE TABLE "memories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "deletedAt" timestamp with time zone, "ownerId" uuid NOT NULL, "type" character varying NOT NULL, "data" jsonb NOT NULL, "isSaved" boolean NOT NULL DEFAULT false, "memoryAt" timestamp with time zone NOT NULL, "seenAt" timestamp with time zone, "showAt" timestamp with time zone, "hideAt" timestamp with time zone, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "memories_assets_assets" ("memoriesId" uuid NOT NULL, "assetsId" uuid NOT NULL);`.execute(db);
  await sql`CREATE TABLE "move_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityId" uuid NOT NULL, "pathType" character varying NOT NULL, "oldPath" character varying NOT NULL, "newPath" character varying NOT NULL);`.execute(db);
  await sql`CREATE TABLE "naturalearth_countries" ("id" integer NOT NULL GENERATED ALWAYS AS IDENTITY, "admin" character varying(50) NOT NULL, "admin_a3" character varying(3) NOT NULL, "type" character varying(50) NOT NULL, "coordinates" polygon NOT NULL);`.execute(db);
  await sql`CREATE TABLE "partners_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "sharedById" uuid NOT NULL, "sharedWithId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`CREATE TABLE "partners" ("sharedById" uuid NOT NULL, "sharedWithId" uuid NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "inTimeline" boolean NOT NULL DEFAULT false, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "deviceType" character varying NOT NULL DEFAULT '', "deviceOS" character varying NOT NULL DEFAULT '', "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "shared_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "userId" uuid NOT NULL, "key" bytea NOT NULL, "type" character varying NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "expiresAt" timestamp with time zone, "allowUpload" boolean NOT NULL DEFAULT false, "albumId" uuid, "allowDownload" boolean NOT NULL DEFAULT true, "showExif" boolean NOT NULL DEFAULT true, "password" character varying);`.execute(db);
  await sql`CREATE TABLE "shared_link__asset" ("assetsId" uuid NOT NULL, "sharedLinksId" uuid NOT NULL);`.execute(db);
  await sql`CREATE TABLE "smart_search" ("assetId" uuid NOT NULL, "embedding" vector(512) NOT NULL);`.execute(db);
  await sql`ALTER TABLE "smart_search" ALTER COLUMN "embedding" SET STORAGE EXTERNAL;`.execute(db);
  await sql`CREATE TABLE "session_sync_checkpoints" ("sessionId" uuid NOT NULL, "type" character varying NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "ack" character varying NOT NULL, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "system_metadata" ("key" character varying NOT NULL, "value" jsonb NOT NULL);`.execute(db);
  await sql`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "value" character varying NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "color" character varying, "parentId" uuid, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "tag_asset" ("assetsId" uuid NOT NULL, "tagsId" uuid NOT NULL);`.execute(db);
  await sql`CREATE TABLE "tags_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL);`.execute(db);
  await sql`CREATE TABLE "users_audit" ("userId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(), "id" uuid NOT NULL DEFAULT immich_uuid_v7());`.execute(db);
  await sql`CREATE TABLE "user_metadata" ("userId" uuid NOT NULL, "key" character varying NOT NULL, "value" jsonb NOT NULL);`.execute(db);
  await sql`CREATE TABLE "version_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "version" character varying NOT NULL);`.execute(db);
  await sql`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "libraries" ADD CONSTRAINT "PK_505fedfcad00a09b3734b4223de" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD CONSTRAINT "PK_74a27e7fcbd5852463d0af3034b" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "albums" ADD CONSTRAINT "PK_7f71c7b5bc7c87b8f94c9a93a00" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180" PRIMARY KEY ("albumsId", "assetsId");`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "PK_7df55657e0b2e8b626330a0ebc8" PRIMARY KEY ("albumsId", "usersId");`.execute(db);
  await sql`ALTER TABLE "api_keys" ADD CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "assets_audit" ADD CONSTRAINT "PK_99bd5c015f81a641927a32b4212" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_faces" ADD CONSTRAINT "PK_6df76ab2eb6f5b57b7c2f1fc684" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_files" ADD CONSTRAINT "PK_c41dc3e9ef5e1c57ca5a08a0004" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4" PRIMARY KEY ("assetId");`.execute(db);
  await sql`ALTER TABLE "audit" ADD CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "exif" ADD CONSTRAINT "PK_c0117fdbc50b917ef9067740c44" PRIMARY KEY ("assetId");`.execute(db);
  await sql`ALTER TABLE "face_search" ADD CONSTRAINT "face_search_pkey" PRIMARY KEY ("faceId");`.execute(db);
  await sql`ALTER TABLE "geodata_places" ADD CONSTRAINT "PK_c29918988912ef4036f3d7fbff4" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "memories" ADD CONSTRAINT "PK_aaa0692d9496fe827b0568612f8" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "PK_fcaf7112a013d1703c011c6793d" PRIMARY KEY ("memoriesId", "assetsId");`.execute(db);
  await sql`ALTER TABLE "move_history" ADD CONSTRAINT "PK_af608f132233acf123f2949678d" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "naturalearth_countries" ADD CONSTRAINT "PK_21a6d86d1ab5d841648212e5353" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "partners_audit" ADD CONSTRAINT "PK_952b50217ff78198a7e380f0359" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "partners" ADD CONSTRAINT "PK_f1cc8f73d16b367f426261a8736" PRIMARY KEY ("sharedById", "sharedWithId");`.execute(db);
  await sql`ALTER TABLE "sessions" ADD CONSTRAINT "PK_48cb6b5c20faa63157b3c1baf7f" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "shared_links" ADD CONSTRAINT "PK_642e2b0f619e4876e5f90a43465" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3" PRIMARY KEY ("assetsId", "sharedLinksId");`.execute(db);
  await sql`ALTER TABLE "smart_search" ADD CONSTRAINT "smart_search_pkey" PRIMARY KEY ("assetId");`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoints" ADD CONSTRAINT "PK_b846ab547a702863ef7cd9412fb" PRIMARY KEY ("sessionId", "type");`.execute(db);
  await sql`ALTER TABLE "system_metadata" ADD CONSTRAINT "PK_fa94f6857470fb5b81ec6084465" PRIMARY KEY ("key");`.execute(db);
  await sql`ALTER TABLE "tags" ADD CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD CONSTRAINT "PK_ef5346fe522b5fb3bc96454747e" PRIMARY KEY ("assetsId", "tagsId");`.execute(db);
  await sql`ALTER TABLE "tags_closure" ADD CONSTRAINT "PK_eab38eb12a3ec6df8376c95477c" PRIMARY KEY ("id_ancestor", "id_descendant");`.execute(db);
  await sql`ALTER TABLE "users_audit" ADD CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "user_metadata" ADD CONSTRAINT "PK_5931462150b3438cbc83277fe5a" PRIMARY KEY ("userId", "key");`.execute(db);
  await sql`ALTER TABLE "version_history" ADD CONSTRAINT "PK_5db259cbb09ce82c0d13cfd1b23" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "libraries" ADD CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_91704e101438fd0653f582426dc" FOREIGN KEY ("primaryAssetId") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_c05079e542fd74de3b5ecb5c1c8" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "FK_2c5ac0d6fb58b238fd2068de67d" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c" FOREIGN KEY ("libraryId") REFERENCES "libraries" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207" FOREIGN KEY ("stackId") REFERENCES "asset_stack" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "albums" ADD CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "albums" ADD CONSTRAINT "FK_05895aa505a670300d4816debce" FOREIGN KEY ("albumThumbnailAssetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "FK_1af8519996fbfb3684b58df280b" FOREIGN KEY ("albumId") REFERENCES "albums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "FK_8091ea76b12338cb4428d33d782" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_e590fa396c6898fcd4a50e40927" FOREIGN KEY ("albumsId") REFERENCES "albums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "FK_427c350ad49bd3935a50baab737" FOREIGN KEY ("albumsId") REFERENCES "albums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "FK_f48513bf9bccefd6ff3ad30bd06" FOREIGN KEY ("usersId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6c2e267ae764a9413b863a29342" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "FK_5527cc99f530a547093f9e577b6" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" FOREIGN KEY ("faceAssetId") REFERENCES "asset_faces" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "asset_files" ADD CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "exif" ADD CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "face_search" ADD CONSTRAINT "face_search_faceId_fkey" FOREIGN KEY ("faceId") REFERENCES "asset_faces" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "memories" ADD CONSTRAINT "FK_575842846f0c28fa5da46c99b19" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_984e5c9ab1f04d34538cd32334e" FOREIGN KEY ("memoriesId") REFERENCES "memories" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f" FOREIGN KEY ("assetsId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "partners" ADD CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" FOREIGN KEY ("sharedById") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "partners" ADD CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" FOREIGN KEY ("sharedWithId") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66" FOREIGN KEY ("albumId") REFERENCES "albums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66" FOREIGN KEY ("assetsId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "smart_search" ADD CONSTRAINT "smart_search_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoints" ADD CONSTRAINT "FK_d8ddd9d687816cc490432b3d4bc" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tags" ADD CONSTRAINT "FK_9f9590cc11561f1f48ff034ef99" FOREIGN KEY ("parentId") REFERENCES "tags" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" FOREIGN KEY ("assetsId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42" FOREIGN KEY ("tagsId") REFERENCES "tags" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_15fbcbc67663c6bfc07b354c22c" FOREIGN KEY ("id_ancestor") REFERENCES "tags" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_b1a2a7ed45c29179b5ad51548a1" FOREIGN KEY ("id_descendant") REFERENCES "tags" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "user_metadata" ADD CONSTRAINT "FK_6afb43681a21cf7815932bc38ac" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email");`.execute(db);
  await sql`ALTER TABLE "users" ADD CONSTRAINT "UQ_b309cf34fa58137c416b32cea3a" UNIQUE ("storageLabel");`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD CONSTRAINT "REL_91704e101438fd0653f582426d" UNIQUE ("primaryAssetId");`.execute(db);
  await sql`ALTER TABLE "asset_files" ADD CONSTRAINT "UQ_assetId_type" UNIQUE ("assetId", "type");`.execute(db);
  await sql`ALTER TABLE "move_history" ADD CONSTRAINT "UQ_newPath" UNIQUE ("newPath");`.execute(db);
  await sql`ALTER TABLE "move_history" ADD CONSTRAINT "UQ_entityId_pathType" UNIQUE ("entityId", "pathType");`.execute(db);
  await sql`ALTER TABLE "shared_links" ADD CONSTRAINT "UQ_sharedlink_key" UNIQUE ("key");`.execute(db);
  await sql`ALTER TABLE "tags" ADD CONSTRAINT "UQ_79d6f16e52bb2c7130375246793" UNIQUE ("userId", "value");`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "CHK_2ab1e70f113f450eb40c1e3ec8" CHECK (("comment" IS NULL AND "isLiked" = true) OR ("comment" IS NOT NULL AND "isLiked" = false));`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "CHK_b0f82b0ed662bfc24fbb58bb45" CHECK ("birthDate" <= CURRENT_DATE);`.execute(db);
  await sql`CREATE INDEX "IDX_users_updated_at_asc_id_asc" ON "users" ("updatedAt", "id")`.execute(db);
  await sql`CREATE INDEX "IDX_users_update_id" ON "users" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_0f6fc2fb195f24d19b0fb0d57c" ON "libraries" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "IDX_libraries_update_id" ON "libraries" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_91704e101438fd0653f582426d" ON "asset_stack" ("primaryAssetId")`.execute(db);
  await sql`CREATE INDEX "IDX_c05079e542fd74de3b5ecb5c1c" ON "asset_stack" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "idx_originalfilename_trigram" ON "assets" USING gin (f_unaccent("originalFileName") gin_trgm_ops)`.execute(db);
  await sql`CREATE INDEX "IDX_asset_id_stackId" ON "assets" ("id", "stackId")`.execute(db);
  await sql`CREATE INDEX "IDX_originalPath_libraryId" ON "assets" ("originalPath", "libraryId")`.execute(db);
  await sql`CREATE INDEX "idx_local_date_time_month" ON "assets" ((date_trunc('MONTH'::text, ("localDateTime" AT TIME ZONE 'UTC'::text)) AT TIME ZONE 'UTC'::text))`.execute(db);
  await sql`CREATE INDEX "idx_local_date_time" ON "assets" ((("localDateTime" at time zone 'UTC')::date))`.execute(db);
  await sql`CREATE UNIQUE INDEX "UQ_assets_owner_library_checksum" ON "assets" ("ownerId", "libraryId", "checksum") WHERE ("libraryId" IS NOT NULL)`.execute(db);
  await sql`CREATE UNIQUE INDEX "UQ_assets_owner_checksum" ON "assets" ("ownerId", "checksum") WHERE ("libraryId" IS NULL)`.execute(db);
  await sql`CREATE INDEX "IDX_2c5ac0d6fb58b238fd2068de67" ON "assets" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "idx_asset_file_created_at" ON "assets" ("fileCreatedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_8d3efe36c0755849395e6ea866" ON "assets" ("checksum")`.execute(db);
  await sql`CREATE INDEX "IDX_16294b83fa8c0149719a1f631e" ON "assets" ("livePhotoVideoId")`.execute(db);
  await sql`CREATE INDEX "IDX_4d66e76dada1ca180f67a205dc" ON "assets" ("originalFileName")`.execute(db);
  await sql`CREATE INDEX "IDX_9977c3c1de01c3d848039a6b90" ON "assets" ("libraryId")`.execute(db);
  await sql`CREATE INDEX "IDX_f15d48fa3ea5e4bda05ca8ab20" ON "assets" ("stackId")`.execute(db);
  await sql`CREATE INDEX "IDX_assets_duplicateId" ON "assets" ("duplicateId")`.execute(db);
  await sql`CREATE INDEX "IDX_assets_update_id" ON "assets" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_b22c53f35ef20c28c21637c85f" ON "albums" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "IDX_05895aa505a670300d4816debc" ON "albums" ("albumThumbnailAssetId")`.execute(db);
  await sql`CREATE INDEX "IDX_albums_update_id" ON "albums" ("updateId")`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_activity_like" ON "activity" ("assetId", "userId", "albumId") WHERE ("isLiked" = true)`.execute(db);
  await sql`CREATE INDEX "IDX_1af8519996fbfb3684b58df280" ON "activity" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_3571467bcbe021f66e2bdce96e" ON "activity" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_8091ea76b12338cb4428d33d78" ON "activity" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_activity_update_id" ON "activity" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_e590fa396c6898fcd4a50e4092" ON "albums_assets_assets" ("albumsId")`.execute(db);
  await sql`CREATE INDEX "IDX_4bd1303d199f4e72ccdf998c62" ON "albums_assets_assets" ("assetsId")`.execute(db);
  await sql`CREATE INDEX "IDX_f48513bf9bccefd6ff3ad30bd0" ON "albums_shared_users_users" ("usersId")`.execute(db);
  await sql`CREATE INDEX "IDX_427c350ad49bd3935a50baab73" ON "albums_shared_users_users" ("albumsId")`.execute(db);
  await sql`CREATE INDEX "IDX_6c2e267ae764a9413b863a2934" ON "api_keys" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_api_keys_update_id" ON "api_keys" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_assets_audit_asset_id" ON "assets_audit" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_assets_audit_owner_id" ON "assets_audit" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "IDX_assets_audit_deleted_at" ON "assets_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_5527cc99f530a547093f9e577b" ON "person" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "IDX_2bbabe31656b6778c6b87b6102" ON "person" ("faceAssetId")`.execute(db);
  await sql`CREATE INDEX "IDX_person_update_id" ON "person" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_bf339a24070dac7e71304ec530" ON "asset_faces" ("personId", "assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_asset_faces_assetId_personId" ON "asset_faces" ("assetId", "personId")`.execute(db);
  await sql`CREATE INDEX "IDX_02a43fd0b3c50fb6d7f0cb7282" ON "asset_faces" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_95ad7106dd7b484275443f580f" ON "asset_faces" ("personId")`.execute(db);
  await sql`CREATE INDEX "IDX_asset_files_assetId" ON "asset_files" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_asset_files_update_id" ON "asset_files" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_ownerId_createdAt" ON "audit" ("ownerId", "createdAt")`.execute(db);
  await sql`CREATE INDEX "exif_city" ON "exif" ("city")`.execute(db);
  await sql`CREATE INDEX "IDX_live_photo_cid" ON "exif" ("livePhotoCID")`.execute(db);
  await sql`CREATE INDEX "IDX_auto_stack_id" ON "exif" ("autoStackId")`.execute(db);
  await sql`CREATE INDEX "IDX_asset_exif_update_id" ON "exif" ("updateId")`.execute(db);
  await sql.raw(vectorIndexQuery({ vectorExtension, table: 'face_search', indexName: 'face_index' })).execute(db);
  await sql`CREATE INDEX "IDX_geodata_gist_earthcoord" ON "geodata_places" (ll_to_earth_public(latitude, longitude))`.execute(db);
  await sql`CREATE INDEX "idx_geodata_places_name" ON "geodata_places" USING gin (f_unaccent("name") gin_trgm_ops)`.execute(db);
  await sql`CREATE INDEX "idx_geodata_places_admin2_name" ON "geodata_places" USING gin (f_unaccent("admin2Name") gin_trgm_ops)`.execute(db);
  await sql`CREATE INDEX "idx_geodata_places_admin1_name" ON "geodata_places" USING gin (f_unaccent("admin1Name") gin_trgm_ops)`.execute(db);
  await sql`CREATE INDEX "idx_geodata_places_alternate_names" ON "geodata_places" USING gin (f_unaccent("alternateNames") gin_trgm_ops)`.execute(db);
  await sql`CREATE INDEX "IDX_575842846f0c28fa5da46c99b1" ON "memories" ("ownerId")`.execute(db);
  await sql`CREATE INDEX "IDX_memories_update_id" ON "memories" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_984e5c9ab1f04d34538cd32334" ON "memories_assets_assets" ("memoriesId")`.execute(db);
  await sql`CREATE INDEX "IDX_6942ecf52d75d4273de19d2c16" ON "memories_assets_assets" ("assetsId")`.execute(db);
  await sql`CREATE INDEX "IDX_partners_audit_shared_by_id" ON "partners_audit" ("sharedById")`.execute(db);
  await sql`CREATE INDEX "IDX_partners_audit_shared_with_id" ON "partners_audit" ("sharedWithId")`.execute(db);
  await sql`CREATE INDEX "IDX_partners_audit_deleted_at" ON "partners_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_7e077a8b70b3530138610ff5e0" ON "partners" ("sharedById")`.execute(db);
  await sql`CREATE INDEX "IDX_d7e875c6c60e661723dbf372fd" ON "partners" ("sharedWithId")`.execute(db);
  await sql`CREATE INDEX "IDX_partners_update_id" ON "partners" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_sessions_update_id" ON "sessions" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_66fe3837414c5a9f1c33ca4934" ON "shared_links" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_sharedlink_key" ON "shared_links" ("key")`.execute(db);
  await sql`CREATE INDEX "IDX_sharedlink_albumId" ON "shared_links" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_5b7decce6c8d3db9593d6111a6" ON "shared_link__asset" ("assetsId")`.execute(db);
  await sql`CREATE INDEX "IDX_c9fab4aa97ffd1b034f3d6581a" ON "shared_link__asset" ("sharedLinksId")`.execute(db);
  await sql.raw(vectorIndexQuery({ vectorExtension, table: 'smart_search', indexName: 'clip_index' })).execute(db);
  await sql`CREATE INDEX "IDX_d8ddd9d687816cc490432b3d4b" ON "session_sync_checkpoints" ("sessionId")`.execute(db);
  await sql`CREATE INDEX "IDX_session_sync_checkpoints_update_id" ON "session_sync_checkpoints" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_92e67dc508c705dd66c9461557" ON "tags" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_9f9590cc11561f1f48ff034ef9" ON "tags" ("parentId")`.execute(db);
  await sql`CREATE INDEX "IDX_tags_update_id" ON "tags" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_tag_asset_assetsId_tagsId" ON "tag_asset" ("assetsId", "tagsId")`.execute(db);
  await sql`CREATE INDEX "IDX_f8e8a9e893cb5c54907f1b798e" ON "tag_asset" ("assetsId")`.execute(db);
  await sql`CREATE INDEX "IDX_e99f31ea4cdf3a2c35c7287eb4" ON "tag_asset" ("tagsId")`.execute(db);
  await sql`CREATE INDEX "IDX_15fbcbc67663c6bfc07b354c22" ON "tags_closure" ("id_ancestor")`.execute(db);
  await sql`CREATE INDEX "IDX_b1a2a7ed45c29179b5ad51548a" ON "tags_closure" ("id_descendant")`.execute(db);
  await sql`CREATE INDEX "IDX_users_audit_deleted_at" ON "users_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_6afb43681a21cf7815932bc38a" ON "user_metadata" ("userId")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "users_delete_audit"
  AFTER DELETE ON "users"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION users_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "users_updated_at"
  BEFORE UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "libraries_updated_at"
  BEFORE UPDATE ON "libraries"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "assets_delete_audit"
  AFTER DELETE ON "assets"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "assets_updated_at"
  BEFORE UPDATE ON "assets"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "albums_updated_at"
  BEFORE UPDATE ON "albums"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "activity_updated_at"
  BEFORE UPDATE ON "activity"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "api_keys_updated_at"
  BEFORE UPDATE ON "api_keys"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_updated_at"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_files_updated_at"
  BEFORE UPDATE ON "asset_files"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_exif_updated_at"
  BEFORE UPDATE ON "exif"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memories_updated_at"
  BEFORE UPDATE ON "memories"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partners_delete_audit"
  AFTER DELETE ON "partners"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION partners_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "partners_updated_at"
  BEFORE UPDATE ON "partners"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "sessions_updated_at"
  BEFORE UPDATE ON "sessions"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "session_sync_checkpoints_updated_at"
  BEFORE UPDATE ON "session_sync_checkpoints"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tags_updated_at"
  BEFORE UPDATE ON "tags"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(): Promise<void> {
// not implemented
}
