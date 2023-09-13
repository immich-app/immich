---
sidebar_position: 3
---

# Helpful database queries for advanced debugging of Immich

:::danger

Keep in mind that mucking around in the database might set the moon on fire, as I've been told.
All queries provided below should not modify anything.
Do NOT modify the database, as this will break your install.

Nevertheless, it is highly recommended to have current backups.
As always: No backup? No pity!

:::

## Prerequisites

In order to execute the queries, you must first connect to the container and get the postgres shell.

### Docker Compose

If you are using docker compose, simply run `docker exec -it immich_postgres psql immich DB_USERNAME` while `DB_USERNAME`
should be replaced by the according value [set in your `.env` file](https://docs.immich.app/docs/install/environment-variables#database).

### GUI (Portainer, Unraid, ...)

When using a GUI, it will most likely provide the ability to create a shell within the container.
In that shell, simply run `psql immich DB_USERNAME` while replacing your `DB_USERNAME` like explained above.

### Kubernetes

If you're using Kubernetes in your home lab you know what you are doing and how to run a command anyway.

## Queries

:::caution
Don't forget the ';' at the end of each query ;)
:::

### Get asset information by file name

```sql
SELECT
	"id" AS "Id", "originalFileName" AS "File name", "originalPath" AS "Path"
FROM
	"assets"
WHERE
	"originalFileName" = 'FILE NAME';
```

`FILE NAME` should hereby be replaced by the according file name.

### Get all assets without metadata

```sql
SELECT
  "assetId" AS "Id", "originalFileName" AS "File name", "livePhotoCID" AS "Live photo id"
FROM
  "exif"
LEFT JOIN
  "assets" ON "assets"."id" = "exif"."assetId"
WHERE
	"exif"."assetId" IS NULL;
```

### Get stored system config

**Only applicable when not using the [config file](https://docs.immich.app/docs/install/config-file).**

```sql
SELECT
	"key" AS "Setting", "value" AS "Value"
FROM
	"system_config";
```
