# Backup and Restore

## Database

:::info
Refer to the official [postgres documentation](https://www.postgresql.org/docs/current/backup.html) for details about backing up and restoring a postgres database.
:::

The recommended way to backup and restore the Immich database is to use the `pg_dumpall` command.

```bash title='Backup'
docker exec -t immich_postgres pg_dumpall -c -U postgres | gzip > "/path/to/backup/dump.sql.gz"
```

```bash title='Restore'
docker-compose down -v  # CAUTION! Deletes all Immich data to start from scratch.
docker-compose pull     # Update to latest version of Immich (if desired)
docker-compose create   # Create Docker containers for Immich apps without running them.
docker start immich_postgres    # Start Postgres server
sleep 10    # Wait for Postgres server to start up
gunzip < "/path/to/backup/dump.sql.gz" | docker exec -i immich_postgres psql -U postgres -d immich    # Restore Backup
docker-compose up -d    # Start remainder of Immich apps
```

Note that for the database restore to proceed properly, it requires a completely fresh install (i.e. the Immich server has never run since creating the Docker containers). If the Immich app has run, Postgres conflicts may be encountered upon database restoration (relation already exists, violated foreign key constraints, multiple primary keys, etc.).

The database dumps can also be automated (using [this image](https://github.com/prodrigestivill/docker-postgres-backup-local)) by editing the docker compose file to match the following:

```yaml
services:
  ...
  backup:
    container_name: immich_db_dumper
    image: prodrigestivill/postgres-backup-local
    env_file:
      - .env
    environment:
      POSTGRES_HOST: database
      POSTGRES_DB: ${DB_DATABASE_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_NUM_KEEP: 7
      BACKUP_DIR: /db_dumps
    volumes:
      - ./db_dumps:/db_dumps
    depends_on:
      - database
```

Then you can restore with the same command but pointed at the latest dump.

```bash title='Automated Restore'
gunzip < db_dumps/last/immich-latest.sql.gz | docker exec -i immich_postgres psql -U postgres -d immich
```

## Filesystem

Immich stores two types of content in the filesystem: (1) original, unmodified content, and (2) generated content. Only the original content needs to be backed-up, which includes the following folders:

1. `UPLOAD_LOCATION/library`
1. `UPLOAD_LOCATION/upload`
1. `UPLOAD_LOCATION/profile`
