# Database Queries

:::danger
Keep in mind that mucking around in the database might set the moon on fire. Avoid modifying the database directly when possible, and always have current backups.
:::

:::tip
Run `docker exec -it immich_postgres psql immich <DB_USERNAME>` to connect to the database via the container directly.

(Replace `<DB_USERNAME>` with the value from your [`.env` file](/docs/install/environment-variables#database)).
:::

## Assets

:::note
The `"originalFileName"` column is the name of the file at time of upload, including the extension.
:::

```sql title="Find by original filename"
SELECT * FROM "assets" WHERE "originalFileName" = 'PXL_20230903_232542848.jpg';
SELECT * FROM "assets" WHERE "originalFileName" LIKE 'PXL_%'; -- all files starting with PXL_
SELECT * FROM "assets" WHERE "originalFileName" LIKE '%_2023_%'; -- all files with _2023_ in the middle
```

```sql title="Find by path"
SELECT * FROM "assets" WHERE "originalPath" = 'upload/library/admin/2023/2023-09-03/PXL_20230903_232542848.jpg';
SELECT * FROM "assets" WHERE "originalPath" LIKE 'upload/library/admin/2023/%';
```

:::note
You can calculate the checksum for a particular file by using the command `sha1sum <filename>`.
:::

```sql title="Find by checksum (SHA-1)"
SELECT encode("checksum", 'hex') FROM "assets";
SELECT * FROM "assets" WHERE "checksum" = decode('69de19c87658c4c15d9cacb9967b8e033bf74dd1', 'hex');
SELECT * FROM "assets" WHERE "checksum" = '\x69de19c87658c4c15d9cacb9967b8e033bf74dd1'; -- alternate notation
```

```sql title="Live photos"
SELECT * FROM "assets" WHERE "livePhotoVideoId" IS NOT NULL;
```

```sql title="By description"
SELECT "assets".*, "exif"."description" FROM "exif"
  JOIN "assets" ON "assets"."id" = "exif"."assetId"
  WHERE TRIM("exif"."description") <> ''; -- all files with a description
SELECT "assets".*, "exif"."description" FROM "exif"
  JOIN "assets" ON "assets"."id" = "exif"."assetId"
  WHERE "exif"."description" ILIKE '%string to match%'; -- search by string
```

```sql title="Without metadata"
SELECT "assets".* FROM "exif"
  LEFT JOIN "assets" ON "assets"."id" = "exif"."assetId"
  WHERE "exif"."assetId" IS NULL;
```

```sql title="size < 100,000 bytes, smallest to largest"
SELECT * FROM "assets"
  JOIN "exif" ON "assets"."id" = "exif"."assetId"
  WHERE "exif"."fileSizeInByte" < 100000
  ORDER BY "exif"."fileSizeInByte" ASC;
```

```sql title="Without thumbnails"
SELECT * FROM "assets" WHERE "assets"."previewPath" IS NULL OR "assets"."thumbnailPath" IS NULL;
```

```sql title="By type"
SELECT * FROM "assets" WHERE "assets"."type" = 'VIDEO';
SELECT * FROM "assets" WHERE "assets"."type" = 'IMAGE';
```

```sql title="Count by type"
SELECT "assets"."type", COUNT(*) FROM "assets" GROUP BY "assets"."type";
```

```sql title="Count by type (per user)"
SELECT "users"."email", "assets"."type", COUNT(*) FROM "assets"
  JOIN "users" ON "assets"."ownerId" = "users"."id"
  GROUP BY "assets"."type", "users"."email"
  ORDER BY "users"."email";
```

```sql title="Failed file movements"
SELECT * FROM "move_history";
```

## Users

```sql title="List all users"
SELECT * FROM "users";
```

## System Config

```sql title="Custom settings"
SELECT "key", "value" FROM "system_config";
```

(Only used when not using the [config file](/docs/install/config-file))

## Persons

```sql title="Delete person and unset it for the faces it was associated with"
DELETE FROM "person" WHERE "name" = 'PersonNameHere';
```
