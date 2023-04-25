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
gunzip < /path/to/backup/dump.sql.gz | docker exec -i immich_postgres psql -U postgres -d immich
```

## Filesystem

Immich stores two types of content in the filesystem: (1) original, unmodified content, and (2) generated content. Only the original content needs to be backed-up, which includes the following folders:

1. `UPLOAD_LOCATION/library`
1. `UPLOAD_LOCATION/upload`
1. `UPLOAD_LOCATION/profile`
