# Pre-existing Postgres

While not officially recommended, it is possible to run Immich using a pre-existing Postgres server. To use this setup, you should have a baseline level of familiarity with Postgres and the Linux command line. If you do not have these, we recommend using the default setup with a dedicated Postgres container.

By default, Immich expects superuser permission on the Postgres database and requires certain extensions to be installed. This guide outlines the steps required to prepare a pre-existing Postgres server to be used by Immich.

:::tip
Running with a pre-existing Postgres server can unlock powerful administrative features, including logical replication, data page checksums, and streaming write-ahead log backups using programs like pgBackRest or Barman.
:::

## Prerequisites

You must install pgvecto.rs using their [instructions](https://docs.pgvecto.rs/getting-started/installation.html). After installation, add `shared_preload_libraries = 'vectors.so'` to your `postgresql.conf`. If you already have some `shared_preload_libraries` set, you can separate each extension with a comma. For example, `shared_preload_libraries = 'pg_stat_statements, vectors.so'`.

:::note
Make sure the installed version of pgvecto.rs is compatible with your version of Immich. For example, if your Immich version uses the dedicated database image `tensorchord/pgvecto-rs:pg14-v0.2.1`, you must install pgvecto.rs `>= 0.2.1, < 0.3.0`.
:::

## Specifying the connection URL

You can connect to your pre-existing Postgres server by setting the `DB_URL` environment variable in the `.env` file.

```
DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename'

# require a SSL connection to Postgres
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require'

# require a SSL connection, but don't enforce checking the certificate name
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require&sslmode=no-verify'
```

## Without superuser permissions

### Initial installation

Immich can run without superuser permissions by following the below instructions at the `psql` prompt to prepare the database.

```sql title="Set up Postgres for Immich"
CREATE DATABASE <immichdatabasename>;
\c <immichdatabasename>
BEGIN;
ALTER DATABASE <immichdatabasename> OWNER TO <immichdbusername>;
CREATE EXTENSION vectors;
CREATE EXTENSION earthdistance CASCADE;
ALTER DATABASE <immichdatabasename> SET search_path TO "$user", public, vectors;
GRANT USAGE ON SCHEMA vectors TO <immichdbusername>;
ALTER DEFAULT PRIVILEGES IN SCHEMA vectors GRANT SELECT ON TABLES TO <immichdbusername>;
COMMIT;
```

### Updating pgvecto.rs

When installing a new version of pgvecto.rs, you will need to manually update the extension by connecting to the Immich database and running `ALTER EXTENSION vectors UPDATE;`.
