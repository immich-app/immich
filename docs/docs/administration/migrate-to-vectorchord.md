# Migrate to VectorChord

VectorChord is the successor to the deprecated pgvecto.rs extension, with better performance, lower memory usage, and higher quality results for smart search and facial recognition. Immich has migrated to it, so instances still on pgvecto.rs need to make this change.

The steps depend on how the database is deployed — pick the matching section below.

:::info
If you deploy Immich using Docker Compose, see `ghcr.io/immich-app/postgres` in the `docker-compose.yml` file, and have not explicitly set the `DB_VECTOR_EXTENSION` environment variable, your database is already using VectorChord and none of this applies to you.
:::

:::important
If you do not deploy Immich using Docker Compose and see a deprecation warning for pgvecto.rs on server startup, refer to the maintainers of your Immich distribution for guidance (if using a turnkey solution) or adapt the instructions for your specific setup.
:::

Before making any changes, [back up your database](/administration/back-up-and-restore). Every effort has been made to make this migration smooth, but there is always a chance that something goes wrong. See [Backups](/concepts/backups) for what a complete backup includes.

## Docker Compose

Modify your `docker-compose.yml` file as follows.

```diff
  [...]

  database:
    container_name: immich_postgres
-   image: docker.io/tensorchord/pgvecto-rs:pg14-v0.2.0@sha256:739cdd626151ff1f796dc95a6591b55a714f341c737e27f045019ceabf8e8c52
+   image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE_NAME}
      POSTGRES_INITDB_ARGS: '--data-checksums'
+     # Uncomment the DB_STORAGE_TYPE: 'HDD' var if your database isn't stored on SSDs
+     # DB_STORAGE_TYPE: 'HDD'
    volumes:
      # Do not edit the next line. If you want to change the database storage location on your system, edit the value of DB_DATA_LOCATION in the .env file
      - ${DB_DATA_LOCATION}:/var/lib/postgresql/data
-   healthcheck:
-     test: >-
-       pg_isready --dbname="$${POSTGRES_DB}" --username="$${POSTGRES_USER}" || exit 1;
-       Chksum="$$(psql --dbname="$${POSTGRES_DB}" --username="$${POSTGRES_USER}" --tuples-only --no-align
-       --command='SELECT COALESCE(SUM(checksum_failures), 0) FROM pg_stat_database')";
-       echo "checksum failure count is $$Chksum";
-       [ "$$Chksum" = '0' ] || exit 1
-     interval: 5m
-     start_interval: 30s
-     start_period: 5m
-   command: >-
-     postgres
-     -c shared_preload_libraries=vectors.so
-     -c 'search_path="$$user", public, vectors'
-     -c logging_collector=on
-     -c max_wal_size=2GB
-     -c shared_buffers=512MB
-     -c wal_compression=on
+   shm_size: 128mb
    restart: always

    [...]
```

:::important
If you deviated from the defaults of pg14 or pgvectors0.2.0, you must adjust the pg major version and pgvecto.rs version. If you are still using the default `docker.io/tensorchord/pgvecto-rs:pg14-v0.2.0` image, you can just follow the changes above. For example, if the previous image is `docker.io/tensorchord/pgvecto-rs:pg16-v0.3.0`, the new image should be `ghcr.io/immich-app/postgres:16-vectorchord0.3.0-pgvectors0.3.0` instead of the image specified in the diff.
:::

After making these changes, you can start Immich as normal. Immich will make some changes to the DB during startup, which can take seconds to minutes to finish, depending on hardware and library size. In particular, it’s normal for the server logs to be seemingly stuck at `Reindexing clip_index` and `Reindexing face_index` for some time if you have over 100k assets in Immich and/or Immich is on a relatively weak server. If you see these logs and there are no errors, just give it time.

:::danger
After switching to VectorChord, you should not downgrade Immich below 1.133.0.
:::

Please don’t hesitate to contact us on [GitHub](https://github.com/immich-app/immich/discussions) or [Discord](https://discord.immich.app/) if you encounter migration issues.

## Pre-existing Postgres server

For an instance using a [pre-existing Postgres server](/administration/use-a-pre-existing-postgres-server), the path depends on which extension is installed today.

VectorChord is the successor extension to pgvecto.rs, allowing for higher performance, lower memory usage and higher quality results for smart search and facial recognition.

### From pgvecto.rs

Support for pgvecto.rs has been dropped as of 3.0, hence all users currently using pgvecto.rs should migrate to VectorChord. There are two primary approaches to do so.

The easiest option is to have both extensions installed during the migration:

<details>
<summary>Migration steps (automatic)</summary>
1. Ensure you still have pgvecto.rs installed
2. Install `pgvector` (`>= 0.7, < 0.9`). The easiest way to do this is on Debian/Ubuntu by adding the [PostgreSQL Apt repository][pg-apt] and then running `apt install postgresql-NN-pgvector`, where `NN` is your Postgres version (e.g., `16`)
3. [Install VectorChord][vchord-install]
4. Add `shared_preload_libraries= 'vchord.so, vectors.so'` to your `postgresql.conf`, making sure to include _both_ `vchord.so` and `vectors.so`. You may include other libraries here as well if needed
5. Restart the Postgres database
6. If Immich does not have superuser permissions, run the SQL command `CREATE EXTENSION vchord CASCADE;` using psql or your choice of database client
7. Start Immich and wait for the logs `Reindexed face_index` and `Reindexed clip_index` to be output
8. If Immich does not have superuser permissions, run the SQL command `DROP EXTENSION vectors;`
9. Drop the old schema by running `DROP SCHEMA vectors;`
10. Remove the `vectors.so` entry from the `shared_preload_libraries` setting
11. Restart the Postgres database
12. Uninstall pgvecto.rs (e.g. `apt-get purge vectors-pg14` on Debian-based environments, replacing `pg14` as appropriate). `pgvector` must remain installed as it provides the data types used by `vchord`

</details>

If it is not possible to have both VectorChord and pgvecto.rs installed at the same time, you can perform the migration with more manual steps:

<details>
<summary>Migration steps (manual)</summary>
1. While pgvecto.rs is still installed, run the following SQL command using psql or your choice of database client. Take note of the number outputted by this command as you will need it later

```sql
SELECT atttypmod as dimsize
    FROM pg_attribute f
    JOIN pg_class c ON c.oid = f.attrelid
    WHERE c.relkind = 'r'::char
    AND f.attnum > 0
    AND c.relname = 'smart_search'::text
    AND f.attname = 'embedding'::text;
```

2. Remove references to pgvecto.rs using the below SQL commands

```sql
DROP INDEX IF EXISTS clip_index;
DROP INDEX IF EXISTS face_index;
ALTER TABLE smart_search ALTER COLUMN embedding SET DATA TYPE real[];
ALTER TABLE face_search ALTER COLUMN embedding SET DATA TYPE real[];
```

3. [Install VectorChord][vchord-install]
4. Change the columns back to the appropriate vector types, replacing `<number>` with the number from step 1

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
ALTER TABLE smart_search ALTER COLUMN embedding SET DATA TYPE vector(<number>);
ALTER TABLE face_search ALTER COLUMN embedding SET DATA TYPE vector(512);
```

5. Start Immich and let it create new indices using VectorChord

</details>

### From pgvector

<details>
<summary>Migration steps</summary>
1. Ensure you have at least `0.7.0` of pgvector installed. If it is below that, please upgrade it and run the SQL command `ALTER EXTENSION vector UPDATE;` using psql or your choice of database client
2. Follow the Prerequisites to install VectorChord
3. If Immich does not have superuser permissions, run the SQL command `CREATE EXTENSION vchord CASCADE;`
4. Remove the `DB_VECTOR_EXTENSION=pgvector` environmental variable as it will make Immich still use pgvector if set
5. Start Immich and let it create new indices using VectorChord

</details>

Note that VectorChord itself uses pgvector types, so you should not uninstall pgvector after following these steps.

## FAQ

### I have a separate PostgreSQL instance shared with multiple services. How can I switch to VectorChord?

Follow [Pre-existing Postgres server](#pre-existing-postgres-server) below instead of the Docker Compose steps. The path differs depending on whether you are currently using pgvecto.rs or pgvector, and on whether Immich has superuser permissions.

### Why are so many lines removed from the `docker-compose.yml` file? Does this mean the health check is removed?

These lines are now incorporated into the image itself along with some additional tuning.

### What does this change mean for my existing DB backups?

The new DB image includes pgvector and pgvecto.rs in addition to VectorChord, so you can use this image to restore from existing backups that used either of these extensions. However, backups made after switching to VectorChord require an image containing VectorChord to restore successfully.

### Do I still need pgvecto.rs installed after migrating to VectorChord?

pgvecto.rs only needs to be available during the migration, or if you need to restore from a backup that used pgvecto.rs. For a leaner DB and a smaller image, you can optionally switch to an image variant that doesn’t have pgvecto.rs installed after you’ve performed the migration and started Immich: `ghcr.io/immich-app/postgres:14-vectorchord0.4.3`, changing the PostgreSQL version as appropriate.

### Why does it matter whether my database is on an SSD or an HDD?

These storage mediums have different performance characteristics. As a result, the optimal settings for an SSD are not the same as those for an HDD. Either configuration is compatible with SSD and HDD, but using the right configuration will make Immich snappier. As a general tip, we recommend users store the database on an SSD whenever possible.

### Can I use the new database image as a general PostgreSQL image outside of Immich?

It’s a standard PostgreSQL container image that additionally contains the VectorChord, pgvector, and (optionally) pgvecto.rs extensions. If you were using the previous pgvecto.rs image for other purposes, you can similarly do so with this image.

[vchord-install]: https://docs.vectorchord.ai/vectorchord/getting-started/installation.html
[pg-apt]: https://www.postgresql.org/download/linux/#generic
