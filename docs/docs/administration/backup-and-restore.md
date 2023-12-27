# Backup and Restore

A [3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/) is recommended to protect your data. You should keep copies of your uploaded photos/videos as well as the Immich database for a comprehensive backup solution.

## Database

:::caution
Immich saves [file paths in the database](https://github.com/immich-app/immich/discussions/3299), it does not scan the library folder to update the database so backups are crucial.
:::

:::info
Refer to the official [postgres documentation](https://www.postgresql.org/docs/current/backup.html) for details about backing up and restoring a postgres database.
:::

The recommended way to backup and restore the Immich database is to use the `pg_dumpall` command.

```bash title='Backup'
docker exec -t immich_postgres pg_dumpall -c -U postgres | gzip > "/path/to/backup/dump.sql.gz"
```

```bash title='Restore'
docker compose down -v  # CAUTION! Deletes all Immich data to start from scratch.
docker compose pull     # Update to latest version of Immich (if desired)
docker compose create   # Create Docker containers for Immich apps without running them.
docker start immich_postgres    # Start Postgres server
sleep 10    # Wait for Postgres server to start up
gunzip < "/path/to/backup/dump.sql.gz" | docker exec -i immich_postgres psql -U postgres -d immich    # Restore Backup
docker compose up -d    # Start remainder of Immich apps
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

## Template bash script

[Borg](https://www.borgbackup.org/) is a feature-rich deduplicating archiving software with built-in versioning tools. We provide a template bash script that can be run daily/weekly as a [cron](https://wiki.archlinux.org/title/cron) job to back up your files and database. We encourage you to read the quick-start guide for Borg before running this script. This script assumes you have a second hard drive connected to your server for on-site backup and ssh access to a remote machine for your third off-site copy. If you don't have access to a remote machine, you may skip the corresponding steps to keep only local backups.

Borg needs to be installed on your server as well as the remote machine. You can find instructions to install Borg [here](https://borgbackup.readthedocs.io/en/latest/installation.html).
To run this sript as a non-root user, you should [add your username to the docker group](https://docs.docker.com/engine/install/linux-postinstall/). To run this script non-interactively, set up [passwordless ssh](https://www.redhat.com/sysadmin/passwordless-ssh) to your remote machine from your server.

To initialize the borg repository, run the following commands once.

```bash title='Borg set-up'
BACKUP_PATH="/path/to/local/backup/folder"

mkdir "$BACKUP_PATH/immich"
mkdir "$BACKUP_PATH/immich/database"
borg init --encryption=none "$BACKUP_PATH/immich/assets"

## Remote set up
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/folder"

ssh "$REMOTE_HOST" "mkdir $REMOTE_BACKUP_PATH/immich"
ssh "$REMOTE_HOST" "mkdir $REMOTE_BACKUP_PATH/immich/database"
ssh "$REMOTE_HOST" "borg init --encryption=none $REMOTE_BACKUP_PATH/immich/assets"
```

Edit the following script as necessary and add it to your crontab.

```bash title='Borg backup template'
#!/bin/sh

# Paths
IMMICH_ASSETS="/path/to/immich/directory"
BACKUP_PATH="/path/to/local/backup/folder"
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/folder"


### Local
# Back up Immich assets and shared drive
borg create "$BACKUP_PATH"/immich/assets::{now} "$IMMICH_ASSETS"
borg prune --keep-weekly=4 --keep-monthly=3 "$BACKUP_PATH"/immich/assets
borg compact "$BACKUP_PATH"/immich/assets

# Backup Immich database
BACKUP_NAME="backup-$(date +\%y-\%m-\%d).sql.gz"
docker exec -t immich_postgres pg_dumpall -c -U postgres | /usr/bin/gzip > "/tmp/$BACKUP_NAME"
cp "/tmp/$BACKUP_NAME" "$BACKUP_PATH/immich/database/$BACKUP_NAME"

# Keep last 5 backups. For explanation, see https://stackoverflow.com/a/47593062
find "$BACKUP_PATH"/immich/database -type f -printf '%T@\t%p\n' | sort -g |  head -n -5 |  cut -f 2- | xargs -r rm


### Remote
borg create "$REMOTE_HOST":"$REMOTE_BACKUP_PATH"/immich/assets::{now} "$IMMICH_ASSETS"
borg prune --keep-weekly=4 --keep-monthly=3 "$REMOTE_HOST":"$REMOTE_BACKUP_PATH"/immich/assets
borg compact "$REMOTE_HOST":"$REMOTE_BACKUP_PATH"/immich/assets

# Backup Immich database
scp "/tmp/$BACKUP_NAME" "$REMOTE_HOST":"$REMOTE_BACKUP_PATH"/immich/database/ > /dev/null
# Keep last 5 backups.
ssh "$REMOTE_HOST" "find $REMOTE_BACKUP_PATH/immich/database -type f -printf '%T@\t%p\n' | sort -g |  head -n -5 |  cut -f 2- | xargs -r rm"

rm "/tmp/$BACKUP_NAME"
```

Note that this script backs up the `encoded-video` and `thumbs` folders from your Immich directory which is not necessary, but makes restoring easier. If you wish to preserve disk space, you may use the `--exclude` tag with `borg create` to exclude these folders.

e.g., `borg create "$BACKUP_PATH"/immich/assets::{now} "$IMMICH_ASSETS" --exclude $IMMICH_ASSETS/thumbs/*`
