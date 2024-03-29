# Preparing a pre-existing Postgres server

While not officially recommended, it is possible to run Immich using a pre-existing Postgres server. This method is recommended for users that have some baseline level of familiarity with Postgres and the Linux command line. If you do not have these, we recommend using the default setup with a dedicated Postgres container.

By default, Immich expects superuser permission on the Postgres database and requires certain extensions to be installed. This guide outlines the steps required to prepare a pre-existing Postgres server to be used by Immich.

## Prerequisites

You must install pgvecto.rs using their [instructions](https://docs.pgvecto.rs/getting-started/installation.html). After installation, add `shared_preload_libraries = 'vectors.so'` to your `postgresql.conf`. If you already have some `shared_preload_libraries` set, you can separate each extension with a comma. For example, `shared_preload_libraries = 'pg_stat_statements, vectors.so'`.

:::note
Make sure the installed version of pgvecto.rs matches the version of Immich you are running, which may not always be the most recent one. For example, if you Immich version used the database image `tensorchord/pgvecto-rs:pg14-v0.2.0`, you must install `pgvecto.rs 0.2.0`.
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

Immich can run without superuser permissions by following the below instructions at the `psql` prompt to prepare the database.

```sql title="Set up Postgres for Immich"
\c <immichdatabasename>
BEGIN;
ALTER DATABASE <immichdatabasename> OWNER TO <immichdbusername>;
CREATE EXTENSION vectors;
CREATE EXTENSION earthdistance CASCADE;
ALTER DATABASE <immichdatabasename> SET search_path TO "$user", public, vectors;
GRANT USAGE ON SCHEMA vectors TO <immichdbusername>;
GRANT SELECT ON TABLE pg_vector_index_stat to <immichdbusername>;
COMMIT;
```
