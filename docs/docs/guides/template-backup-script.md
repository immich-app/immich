# Backup Script

[Borg](https://www.borgbackup.org/) is a feature-rich deduplicating archiving software with built-in versioning. We provide a template bash script that can be run daily/weekly as a [cron](https://wiki.archlinux.org/title/cron) job to back up your files and database. We encourage you to read the quick-start guide for Borg before running this script.

This script assumes you have a second hard drive connected to your server for on-site backup and ssh access to a remote machine for your third off-site copy. [BorgBase](https://www.borgbase.com/) is an alternative option for off-site backups with a competitive pricing structure. You may choose to skip off-site backups entirely by removing the relevant lines from the template script.

The database is saved to your Immich upload folder in the `database-backup` subdirectory. The database is then backed up and versioned with your assets by Borg. This ensures that the database backup is in sync with your assets in every snapshot.

### Prerequisites

- Borg needs to be installed on your server as well as the remote machine. You can find instructions to install Borg [here](https://borgbackup.readthedocs.io/en/latest/installation.html).
- (Optional) To run this script as a non-root user, you should [add your username to the docker group](https://docs.docker.com/engine/install/linux-postinstall/).
- To run this script non-interactively, set up [passwordless ssh](https://www.redhat.com/sysadmin/passwordless-ssh) to your remote machine from your server. If you skipped the previous step, make sure this step is done from your root account.

To initialize the borg repository, run the following commands once.

```bash title='Borg set-up'
UPLOAD_LOCATION="/path/to/immich/directory"       # Immich database location, as set in your .env file
BACKUP_PATH="/path/to/local/backup/directory"

mkdir "$UPLOAD_LOCATION/database-backup"
borg init --encryption=none "$BACKUP_PATH/immich-borg"

## Remote set up
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/directory"

borg init --encryption=none "$REMOTE_HOST:$REMOTE_BACKUP_PATH/immich-borg"
```

Edit the following script as necessary and add it to your crontab. Note that this script assumes there are no `:`, `@`, or `"` characters in your paths. If these characters exist, you will need to escape and/or rename the paths.

```bash title='Borg backup template'
#!/bin/sh

# Paths
UPLOAD_LOCATION="/path/to/immich/directory"
BACKUP_PATH="/path/to/local/backup/directory"
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/directory"


### Local

# Backup Immich database
docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres > "$UPLOAD_LOCATION"/database-backup/immich-database.sql
# For deduplicating backup programs such as Borg or Restic, compressing the content can increase backup size by making it harder to deduplicate. If you are using a different program or still prefer to compress, you can use the following command instead:
# docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres | /usr/bin/gzip --rsyncable > "$UPLOAD_LOCATION"/database-backup/immich-database.sql.gz

### Append to local Borg repository
borg create "$BACKUP_PATH/immich-borg::{now}" "$UPLOAD_LOCATION" --exclude "$UPLOAD_LOCATION"/thumbs/ --exclude "$UPLOAD_LOCATION"/encoded-video/
borg prune --keep-weekly=4 --keep-monthly=3 "$BACKUP_PATH"/immich-borg
borg compact "$BACKUP_PATH"/immich-borg


### Append to remote Borg repository
borg create "$REMOTE_HOST:$REMOTE_BACKUP_PATH/immich-borg::{now}" "$UPLOAD_LOCATION" --exclude "$UPLOAD_LOCATION"/thumbs/ --exclude "$UPLOAD_LOCATION"/encoded-video/
borg prune --keep-weekly=4 --keep-monthly=3 "$REMOTE_HOST:$REMOTE_BACKUP_PATH"/immich-borg
borg compact "$REMOTE_HOST:$REMOTE_BACKUP_PATH"/immich-borg
```

### Restoring

To restore from a backup, use the `borg mount` command.

```bash title='Restore from local backup'
BACKUP_PATH="/path/to/local/backup/directory"
mkdir /tmp/immich-mountpoint
borg mount "$BACKUP_PATH"/immich-borg /tmp/immich-mountpoint
cd /tmp/immich-mountpoint
```

```bash title='Restore from remote backup'
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/directory"
mkdir /tmp/immich-mountpoint
borg mount "$REMOTE_HOST:$REMOTE_BACKUP_PATH"/immich-borg /tmp/immich-mountpoint
cd /tmp/immich-mountpoint
```

You can find available snapshots in separate sub-directories at `/tmp/immich-mountpoint`. Restore the files you need, and unmount the Borg repository using `borg umount /tmp/immich-mountpoint`
