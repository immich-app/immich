# Pre-existing Postgres

While not officially recommended, it is possible to run Immich using a pre-existing Postgres server. To use this setup, you should have a baseline level of familiarity with Postgres and the Linux command line. If you do not have these, we recommend using the default setup with a dedicated Postgres container.

By default, Immich expects superuser permission on the Postgres database and requires certain extensions to be installed. This guide outlines the steps required to prepare a pre-existing Postgres server to be used by Immich.

:::tip
Running with a pre-existing Postgres server can unlock powerful administrative features, including logical replication and streaming write-ahead log backups using programs like pgBackRest or Barman.
:::

## Prerequisites

You must install VectorChord into your instance of Postgres using their [instructions][vchord-install]. After installation, add `shared_preload_libraries = 'vchord.so'` to your `postgresql.conf`. If you already have some `shared_preload_libraries` set, you can separate each extension with a comma. For example, `shared_preload_libraries = 'pg_stat_statements, vchord.so'`.

:::note
Immich is known to work with Postgres versions 14, 15, 16 and 17. Earlier versions are unsupported.

Make sure the installed version of VectorChord is compatible with your version of Immich. The current accepted range for VectorChord is `>= 0.3.0, < 1.0.0`.
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

When installing a new version of VectorChord, you will need to manually update the extension by connecting to the Immich database and running `ALTER EXTENSION vchord UPDATE;`.

## Migrating to VectorChord

VectorChord is the successor extension to pgvecto.rs, allowing for higher performance, lower memory usage and higher quality results for smart search and facial recognition.

### Migrating from pgvecto.rs

Support for pgvecto.rs will be dropped in a later release, hence we recommend all users currently using pgvecto.rs to migrate to VectorChord at their convenience. There are two primary approaches to do so.

The easiest option is to have both extensions installed during the migration:

1. Ensure you still have pgvecto.rs installed
2. Install `pgvector`. The easiest way to do this is by adding the [PostgreSQL Apt repository][pg-apt] and then running `apt install postgresql-NN-pgvector`, where `NN` is your Postgres version (e.g., `16`).
3. [Install VectorChord][vchord-install]
4. Add `shared_preload_libraries= 'vchord.so, vectors.so'` to your `postgresql.conf`, making sure to include _both_ `vchord.so` and `vectors.so`. You may include other libraries here as well if needed
5. If Immich does not have superuser permissions, run the SQL command `CREATE EXTENSION vchord CASCADE;` using psql or your choice of database client
6. Start Immich and wait for the logs `Reindexed face_index` and `Reindexed clip_index` to be output
7. If Immich does not have superuser permissions, run the SQL command `DROP EXTENSION vectors;`
8. Remove the `vectors.so` entry from the `shared_preload_libraries` setting
9. Uninstall pgvecto.rs (e.g. `apt-get purge vectors-pg14` on Debian-based environments, replacing `pg14` as appropriate). `pgvector` must remain install as it provides the data types used by `vchord`.

If it is not possible to have both VectorChord and pgvecto.rs installed at the same time, you can perform the migration with more manual steps:

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

### Migrating from pgvector

1. Ensure you have at least 0.7.0 of pgvector installed. If it is below that, please upgrade it and run the SQL command `ALTER EXTENSION vector UPDATE;` using psql or your choice of database client
2. Follow the Prerequisites to install VectorChord
3. If Immich does not have superuser permissions, run the SQL command `CREATE EXTENSION vchord CASCADE;`
4. Start Immich and let it create new indices using VectorChord

Note that VectorChord itself uses pgvector types, so you should not uninstall pgvector after following these steps.

### Common errors

#### Permission denied for view

If you get the error `driverError: error: permission denied for view pg_vector_index_stat`, you can fix this by connecting to the Immich database and running `GRANT SELECT ON TABLE pg_vector_index_stat TO <immichdbusername>;`.

[vchord-install]: https://docs.vectorchord.ai/vectorchord/getting-started/installation.html
[pg-apt]: https://www.postgresql.org/download/linux/#generic
