# Preparing up a standalone Postgres server

## Specifying the connection URL

While not the officially recommended method, it is possible to run Immich using an already-existing Postgres server by specifying `DB_URL` in the `.env` file.

:::note
By default, Immich expects superuser permission on the Postgres database.
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

Immich can run with a standalone Postgres server, without superuser permissions, by following the below instructions to prepare the database.

```sql title="Setup Postgres for Immich"
\c <immichdatabasename>
ALTER DATABASE <immichdatabasename> OWNER TO <immichdbusername>;
CREATE EXTENSION IF NOT EXISTS vectors;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
ALTER DATABASE <immichdatabasename> SET search_path TO "$user", public, vectors;
GRANT USAGE ON SCHEMA vectors TO <immichdbusername>;
GRANT SELECT ON TABLE pg_vector_index_stat to <immichdbusername>;
```
