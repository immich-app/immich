# Backup Script

[Borg](https://www.borgbackup.org/) is a feature-rich deduplicating archiving software with built-in versioning. We provide a template bash script that can be run daily/weekly as a [cron](https://wiki.archlinux.org/title/cron) job to back up your files and database. We encourage you to read the quick-start guide for Borg before running this script.

This script assumes you have a second hard drive connected to your server for on-site backup and ssh access to a remote machine for your third off-site copy. [BorgBase](https://www.borgbase.com/) is an alternative option for off-site backups with a competitive pricing structure. You may choose to skip off-site backups entirely by removing the relevant lines from the template script.

The database is saved to your Immich upload folder in the `database-backup` subdirectory. The database is then backed up and versioned with your assets by Borg. This ensures that the database backup is in sync with your assets in every snapshot.

### Prerequisites

- Borg needs to be installed on your server as well as the remote machine. You can find instructions to install Borg [here](https://borgbackup.readthedocs.io/en/latest/installation.html).
- (Optional) To run this sript as a non-root user, you should [add your username to the docker group](https://docs.docker.com/engine/install/linux-postinstall/).
- To run this script non-interactively, set up [passwordless ssh](https://www.redhat.com/sysadmin/passwordless-ssh) to your remote machine from your server. If you skipped the previous step, make sure this step is done from your root account.

Edit the following script as necessary and add it to your crontab. Note that this script assumes there are no `:`, `@`, or `"` characters in your paths. If these characters exist, you will need to escape and/or rename the paths.

```bash title='Borg backup template'
#!/bin/sh

### init Borg setup
_init_setup() {
    if [ ! -d "$UPLOAD_LOCATION/database-backup" ]; then
        mkdir "$UPLOAD_LOCATION/database-backup" || return 1
    fi
    if [ ! -d "$BACKUP_PATH" ]; then
        borg init --encryption=none "$BACKUP_PATH" || return 1
    fi
    ssh_opt="ssh -o StrictHostKeyChecking=no -oConnectTimeout=10"
    if ${ssh_opt} "$REMOTE_HOST" "true"; then
        echo "OK. ssh remote host $REMOTE_HOST"
        if ${ssh_opt} "$REMOTE_HOST" "test -d \"$REMOTE_BACKUP_PATH\""; then
            echo "OK. Found $REMOTE_BACKUP_PATH on remote host."
        else
            echo "Not found $REMOTE_BACKUP_PATH on remote host, borg init begin..."
            borg init --encryption=none "$REMOTE_HOST:$REMOTE_BACKUP_PATH" || return 1
        fi
    else
        echo "FAIL. ssh remote host $REMOTE_HOST"
        return 1
    fi
}

_backup() {
    ### Local
    # Backup Immich database
    docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres >"$UPLOAD_LOCATION"/database-backup/immich-database.sql
    # For deduplicating backup programs such as Borg or Restic, compressing the content can increase backup size by making it harder to deduplicate. If you are using a different program or still prefer to compress, you can use the following command instead:
    # docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres | /usr/bin/gzip --rsyncable > "$UPLOAD_LOCATION"/database-backup/immich-database.sql.gz

    ### Append to local Borg repository
    borg create "$BACKUP_PATH::{now}" "$UPLOAD_LOCATION" --exclude "$UPLOAD_LOCATION"/thumbs/ --exclude "$UPLOAD_LOCATION"/encoded-video/
    borg prune --keep-weekly=4 --keep-monthly=3 "$BACKUP_PATH"
    borg compact "$BACKUP_PATH"

    ### Append to remote Borg repository
    borg create "$REMOTE_HOST:$REMOTE_BACKUP_PATH::{now}" "$UPLOAD_LOCATION" --exclude "$UPLOAD_LOCATION"/thumbs/ --exclude "$UPLOAD_LOCATION"/encoded-video/
    borg prune --keep-weekly=4 --keep-monthly=3 "$REMOTE_HOST:$REMOTE_BACKUP_PATH"
    borg compact "$REMOTE_HOST:$REMOTE_BACKUP_PATH"
}

_restore() {
    tmp_dir=$(mktemp -d)
    if [ "$1" = local ]; then
        borg mount "$BACKUP_PATH" "$tmp_dir"
    elif [ "$1" = remote ]; then
        borg mount "$REMOTE_HOST:$REMOTE_BACKUP_PATH" "$tmp_dir"
    fi
    echo "You can find available snapshots in seperate sub-directories at directory: $tmp_dir"
    echo "    cd $tmp_dir"
    echo "Restore the files you need, and unmount the Borg repository using:"
    echo "    borg umount $tmp_dir"
}

# Paths
UPLOAD_LOCATION="/path/to/immich/directory"
BACKUP_PATH="/path/to/local/backup/immich-borg"
REMOTE_HOST="remote_host@IP"
REMOTE_BACKUP_PATH="/path/to/remote/backup/immich-borg"

case "$1" in
init)
    if _init_setup; then
        echo "init setup OK."
    else
        echo "init setup Fail, exit 1"
        exit 1
    fi
    ;;
backup)
    _backup
    ;;
restore_local)
    _restore local
    ;;
restore_remote)
    _restore remote
    ;;
*)
    echo "Usage: "
    echo "    $0 init, borg init setup"
    echo "    $0 backup, borg backup"
    echo "    $0 restore_local, borg restore from local"
    echo "    $0 restore_remote, borg restore from remote"
    ;;
esac
```

