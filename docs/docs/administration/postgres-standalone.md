# Preparing a pre-existing Postgres server

## Specifying the connection URL

While not officially recommended, it is possible to run Immich using a pre-existing Postgres server by specifying `DB_URL` in the `.env` file.

:::note
By default, Immich expects superuser permission on the Postgres database.
:::

:::tip
This method is recommended for users that have some baseline level of familiarity with Postgres and the Linux command line. If you do not have these, we recommend using the default setup with a separate Postgres container.
:::

### .env setup

```
DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename'

# require a SSL connection to Postgres
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require'

# require a SSL connection, but don't enforce checking the certificate name
# DB_URL='postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename?sslmode=require&sslmode=no-verify'
```

## Standalone Postgres without superuser permissions

Immich can run with a standalone Postgres server, without superuser permissions, by following the below instructions at the `psql` prompt to prepare the database.

:::tip
Before running these commands, you will need to install the version of vecto.rs as currently used by Immich to your system. You will also need to add `shared_preload_libraries = 'vectors.so'` to your `postgresql.conf`
:::

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
