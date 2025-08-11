---
sidebar_position: 95
---

# Upgrading

:::danger Read the release notes
Immich is currently under heavy development, which means you can expect [breaking changes][breaking] and bugs. You should read the release notes prior to updating and take special care when using automated tools like [Watchtower][watchtower].

You can see versions that had breaking changes [here][breaking].
:::

When a new version of Immich is [released][releases], you should read the release notes and account for any breaking changes noted (as mentioned above).
If you use `IMMICH_VERSION` in your `.env` file, it will need to be updated to the latest or desired version.
After that, the application can be upgraded and restarted with the following commands, run in the directory with the `docker-compose.yml` file:

```bash title="Upgrade and restart Immich"
docker compose pull && docker compose up -d
```

To clean up disk space, the old version's obsolete container images can be deleted with the following command:

```bash title="Clean up unused Docker images"
docker image prune
```

[watchtower]: https://containrrr.dev/watchtower/
[breaking]: https://github.com/immich-app/immich/discussions?discussions_q=label%3Achangelog%3Abreaking-change+sort%3Adate_created
[releases]: https://github.com/immich-app/immich/releases

## Migrating to VectorChord

:::info
If you deploy Immich using Docker Compose, see `ghcr.io/immich-app/postgres` in the `docker-compose.yml` file and have not explicitly set the `DB_VECTOR_EXTENSION` environmental variable, your Immich database is already using VectorChord and this section does not apply to you.
:::

:::important
If you do not deploy Immich using Docker Compose and see a deprecation warning for pgvecto.rs on server startup, you should refer to the maintainers of the Immich distribution for guidance (if using a turnkey solution) or adapt the instructions for your specific setup.
:::

Immich has migrated off of the deprecated pgvecto.rs database extension to its successor, [VectorChord](https://github.com/tensorchord/VectorChord), which comes with performance improvements in almost every aspect. This section will guide you on how to make this change in a Docker Compose setup.

Before making any changes, please [back up your database](/docs/administration/backup-and-restore). While every effort has been made to make this migration as smooth as possible, there’s always a chance that something can go wrong.

After making a backup, please modify your `docker-compose.yml` file with the following information.

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

After making these changes, you can start Immich as normal. Immich will make some changes to the DB during startup, which can take seconds to minutes to finish, depending on hardware and library size. In particular, it’s normal for the server logs to be seemingly stuck at `Reindexing clip_index` and `Reindexing face_index`for some time if you have over 100k assets in Immich and/or Immich is on a relatively weak server. If you see these logs and there are no errors, just give it time.

:::danger
After switching to VectorChord, you should not downgrade Immich below 1.133.0.
:::

Please don’t hesitate to contact us on [GitHub](https://github.com/immich-app/immich/discussions) or [Discord](https://discord.immich.app/) if you encounter migration issues.

### VectorChord FAQ

#### I have a separate PostgreSQL instance shared with multiple services. How can I switch to VectorChord?

Please see the [standalone PostgreSQL documentation](/docs/administration/postgres-standalone#migrating-to-vectorchord) for migration instructions. The migration path will be different depending on whether you’re currently using pgvecto.rs or pgvector, as well as whether Immich has superuser DB permissions.

#### Why are so many lines removed from the `docker-compose.yml` file? Does this mean the health check is removed?

These lines are now incorporated into the image itself along with some additional tuning.

#### What does this change mean for my existing DB backups?

The new DB image includes pgvector and pgvecto.rs in addition to VectorChord, so you can use this image to restore from existing backups that used either of these extensions. However, backups made after switching to VectorChord require an image containing VectorChord to restore successfully.

#### Do I still need pgvecto.rs installed after migrating to VectorChord?

pgvecto.rs only needs to be available during the migration, or if you need to restore from a backup that used pgvecto.rs. For a leaner DB and a smaller image, you can optionally switch to an image variant that doesn’t have pgvecto.rs installed after you’ve performed the migration and started Immich: `ghcr.io/immich-app/postgres:14-vectorchord0.4.3`, changing the PostgreSQL version as appropriate.

#### Why does it matter whether my database is on an SSD or an HDD?

These storage mediums have different performance characteristics. As a result, the optimal settings for an SSD are not the same as those for an HDD. Either configuration is compatible with SSD and HDD, but using the right configuration will make Immich snappier. As a general tip, we recommend users store the database on an SSD whenever possible.

#### Can I use the new database image as a general PostgreSQL image outside of Immich?

It’s a standard PostgreSQL container image that additionally contains the VectorChord, pgvector, and (optionally) pgvecto.rs extensions. If you were using the previous pgvecto.rs image for other purposes, you can similarly do so with this image.

#### If pgvecto.rs and pgvector still work, why should I switch to VectorChord?

VectorChord is faster, more stable, uses less RAM, and (with the settings Immich uses) offers higher-quality results than pgvector and pgvecto.rs. This translates to better search and facial recognition experiences. In addition, pgvecto.rs support will be dropped in the future, so changing it sooner will avoid disruption.
