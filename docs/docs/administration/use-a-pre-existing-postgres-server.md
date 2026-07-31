# Use a pre-existing Postgres server

While not officially recommended, it is possible to run Immich using a pre-existing [Postgres](/reference/requirements#database) server. To use this setup, you should have a baseline level of familiarity with Postgres and the Linux command line. If you do not have these, we recommend using the default setup with a dedicated Postgres container.

By default, Immich expects superuser permission on the Postgres database and requires certain extensions to be installed. This guide outlines the steps required to prepare a pre-existing Postgres server to be used by Immich.

If the server is still using pgvecto.rs or pgvector, see [Migrate to VectorChord](/administration/migrate-to-vectorchord) instead.

:::tip
Running with a pre-existing Postgres server can unlock powerful administrative features, including logical replication and streaming write-ahead log backups using programs like pgBackRest or Barman.
:::

## Prerequisites

You must install pgvector as it is a prerequisite for VectorChord.
The easiest way to do this on Debian/Ubuntu is by adding the [PostgreSQL Apt repository][pg-apt] and then
running `apt install postgresql-NN-pgvector`, where `NN` is your Postgres version (e.g., `16`).

You must install VectorChord into your instance of Postgres using their [instructions][vchord-install]. After installation, add `shared_preload_libraries = 'vchord.so'` to your `postgresql.conf`. If you already have some `shared_preload_libraries` set, you can separate each extension with a comma. For example, `shared_preload_libraries = 'pg_stat_statements, vchord.so'`.

The versions Immich supports are listed in [Requirements](/reference/requirements#database).

## Specifying the connection URL

You can connect to your pre-existing Postgres server by setting the `DB_URL` environment variable in the `.env` file.

```
DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename'

# require a SSL connection to Postgres
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require'

# require a SSL connection, but don't enforce checking the certificate name
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require&sslmode=no-verify'
```

## With superuser permission

Typically Immich expects superuser permission in the database, which you can grant by running `ALTER USER <immichdbusername> WITH SUPERUSER;` at the `psql` console. If you prefer not to grant superuser permissions, follow the instructions in the next section.

## Without superuser permission

:::caution
This method is recommended for **advanced users only** and often requires manual intervention when updating Immich.
:::

:::danger
Currently, automated backups require superuser permission due to the usage of `pg_dumpall`.
:::

Immich can run without superuser permissions by following the below instructions at the `psql` prompt to prepare the database.

```sql title="Set up Postgres for Immich"
CREATE DATABASE <immichdatabasename>;
\c <immichdatabasename>
BEGIN;
ALTER DATABASE <immichdatabasename> OWNER TO <immichdbusername>;
CREATE EXTENSION vchord CASCADE;
CREATE EXTENSION earthdistance CASCADE;
COMMIT;
```

### Updating VectorChord

When installing a new version of VectorChord, you will need to manually update the extension and reindex by connecting to the Immich database and running:

```
ALTER EXTENSION vchord UPDATE;
REINDEX INDEX face_index;
REINDEX INDEX clip_index;
```

[vchord-install]: https://docs.vectorchord.ai/vectorchord/getting-started/installation.html
[pg-apt]: https://www.postgresql.org/download/linux/#generic
