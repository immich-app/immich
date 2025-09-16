# Database Queries

:::danger
Keep in mind that mucking around in the database might set the Moon on fire. Avoid modifying the database directly when possible, and always have current backups.
:::

:::tip
Run `docker exec -it immich_postgres psql --dbname=<DB_DATABASE_NAME> --username=<DB_USERNAME>` to connect to the database via the container directly.

(Replace `<DB_DATABASE_NAME>` and `<DB_USERNAME>` with the values from your [`.env` file](/docs/install/environment-variables#database)).
:::

## Assets

### Name

:::note
The `"originalFileName"` column is the name of the file at time of upload, including the extension.
:::

```sql title="Find by original filename"
SELECT * FROM "asset" WHERE "originalFileName" = 'PXL_20230903_232542848.jpg';
SELECT * FROM "asset" WHERE "originalFileName" LIKE 'PXL_%'; -- all files starting with PXL_
SELECT * FROM "asset" WHERE "originalFileName" LIKE '%_2023_%'; -- all files with _2023_ in the middle
```

```sql title="Find by path"
SELECT * FROM "asset" WHERE "originalPath" = 'upload/library/admin/2023/2023-09-03/PXL_2023.jpg';
SELECT * FROM "asset" WHERE "originalPath" LIKE 'upload/library/admin/2023/%';
```

### ID

```sql title="Find by ID"
SELECT * FROM "asset" WHERE "id" = '9f94e60f-65b6-47b7-ae44-a4df7b57f0e9';
```

```sql title="Find by partial ID"
SELECT * FROM "asset" WHERE "id"::text LIKE '%ab431d3a%';
```

### Checksum

:::note
You can calculate the checksum for a particular file by using the command `sha1sum <filename>`.
:::

```sql title="Find by checksum (SHA-1)"
SELECT encode("checksum", 'hex') FROM "asset";
SELECT * FROM "asset" WHERE "checksum" = decode('69de19c87658c4c15d9cacb9967b8e033bf74dd1', 'hex');
SELECT * FROM "asset" WHERE "checksum" = '\x69de19c87658c4c15d9cacb9967b8e033bf74dd1'; -- alternate notation
```

```sql title="Find duplicate assets with identical checksum (SHA-1) (excluding trashed files)"
SELECT T1."checksum", array_agg(T2."id") ids FROM "asset" T1
  INNER JOIN "asset" T2 ON T1."checksum" = T2."checksum" AND T1."id" != T2."id" AND T2."deletedAt" IS NULL
  WHERE T1."deletedAt" IS NULL GROUP BY T1."checksum";
```

### Metadata

```sql title="Live photos"
SELECT * FROM "asset" WHERE "livePhotoVideoId" IS NOT NULL;
```

```sql title="By description"
SELECT "asset".*, "asset_exif"."description" FROM "asset_exif"
  JOIN "asset" ON "asset"."id" = "asset_exif"."assetId"
  WHERE TRIM("asset_exif"."description") <> ''; -- all files with a description
SELECT "asset".*, "asset_exif"."description" FROM "asset_exif"
  JOIN "asset" ON "asset"."id" = "asset_exif"."assetId"
  WHERE "asset_exif"."description" ILIKE '%string to match%'; -- search by string
```

```sql title="Without metadata"
SELECT "asset".* FROM "asset_exif"
  LEFT JOIN "asset" ON "asset"."id" = "asset_exif"."assetId"
  WHERE "asset_exif"."assetId" IS NULL;
```

```sql title="size < 100,000 bytes, smallest to largest"
SELECT * FROM "asset"
  JOIN "asset_exif" ON "asset"."id" = "asset_exif"."assetId"
  WHERE "asset_exif"."fileSizeInByte" < 100000
  ORDER BY "asset_exif"."fileSizeInByte" ASC;
```

### Type

```sql title="By type"
SELECT * FROM "asset" WHERE "asset"."type" = 'VIDEO';
SELECT * FROM "asset" WHERE "asset"."type" = 'IMAGE';
```

```sql title="Count by type"
SELECT "asset"."type", COUNT(*) FROM "asset" GROUP BY "asset"."type";
```

```sql title="Count by type (per user)"
SELECT "user"."email", "asset"."type", COUNT(*) FROM "asset"
  JOIN "user" ON "asset"."ownerId" = "user"."id"
  GROUP BY "asset"."type", "user"."email" ORDER BY "user"."email";
```

## Tags

```sql title="Count by tag"
SELECT "t"."value" AS "tag_name", COUNT(*) AS "number_assets" FROM "tag" "t"
  JOIN "tag_asset" "ta" ON "t"."id" = "ta"."tagsId" JOIN "asset" "a" ON "ta"."assetsId" = "a"."id"
  WHERE "a"."visibility" != 'hidden'
  GROUP BY "t"."value" ORDER BY "number_assets" DESC;
```

```sql title="Count by tag (per user)"
SELECT "t"."value" AS "tag_name", "u"."email" as "user_email", COUNT(*) AS "number_assets" FROM "tag" "t"
  JOIN "tag_asset" "ta" ON "t"."id" = "ta"."tagsId" JOIN "asset" "a" ON "ta"."assetsId" = "a"."id" JOIN "user" "u" ON "a"."ownerId" = "u"."id"
  WHERE "a"."visibility" != 'hidden'
  GROUP BY "t"."value", "u"."email" ORDER BY "number_assets" DESC;
```

## Users

```sql title="List all users"
SELECT * FROM "user";
```

```sql title="Get owner info from asset ID"
SELECT "user".* FROM "user" JOIN "asset" ON "user"."id" = "asset"."ownerId" WHERE "asset"."id" = 'fa310b01-2f26-4b7a-9042-d578226e021f';
```

## Persons

```sql title="Delete person and unset it for the faces it was associated with"
DELETE FROM "person" WHERE "name" = 'PersonNameHere';
```

## System

### Config

```sql title="Custom settings"
SELECT "key", "value" FROM "system_metadata" WHERE "key" = 'system-config';
```

(Only used when not using the [config file](/docs/install/config-file))

### File properties

```sql title="Without thumbnails"
SELECT * FROM "asset"
WHERE (NOT EXISTS (SELECT 1 FROM "asset_file" WHERE "asset"."id" = "asset_file"."assetId" AND "asset_file"."type" = 'thumbnail')
    OR NOT EXISTS (SELECT 1 FROM "asset_file" WHERE "asset"."id" = "asset_file"."assetId" AND "asset_file"."type" = 'preview'))
AND "asset"."visibility" = 'timeline';
```

```sql title="Failed file movements"
SELECT * FROM "move_history";
```

## Postgres internal

```sql title="Change DB_PASSWORD"
ALTER USER <DB_USERNAME> WITH ENCRYPTED PASSWORD 'newpasswordhere';
```
