# Backup and Restore

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A [3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/) is recommended to protect your data. You should keep copies of your uploaded photos/videos as well as the Immich database for a comprehensive backup solution. This page provides an overview on how to backup the database and the location of user-uploaded pictures and videos. A template bash script that can be run as a cron job is provided [here](/docs/guides/template-backup-script.md)

:::danger
The instructions on this page show you how to prepare your Immich instance to be backed up, and which files to take a backup of. You still need to take care of using an actual backup tool to make a backup yourself.
:::

## Database

:::caution
Immich saves [file paths in the database](https://github.com/immich-app/immich/discussions/3299), it does not scan the library folder to update the database so backups are crucial.
:::

:::info
Refer to the official [postgres documentation](https://www.postgresql.org/docs/current/backup.html) for details about backing up and restoring a postgres database.
:::

:::caution
It is not recommended to directly backup the `DB_DATA_LOCATION` folder. Doing so while the database is running can lead to a corrupted backup that cannot be restored.
:::

### Automatic Database Backups

For convenience, Immich will automatically create database backups by default. The backups are stored in `UPLOAD_LOCATION/backups`.  
As mentioned above, you should make your own backup of these together with the asset folders as noted below.  
You can adjust the schedule and amount of kept backups in the [admin settings](http://my.immich.app/admin/system-settings?isOpen=backup).  
By default, Immich will keep the last 14 backups and create a new backup every day at 2:00 AM.

#### Trigger Backup

You are able to trigger a backup in the [admin job status page](http://my.immich.app/admin/jobs-status).
Visit the page, open the "Create job" modal from the top right, select "Backup Database" and click "Confirm".
A job will run and trigger a backup, you can verify this worked correctly by checking the logs or the backup folder.
This backup will count towards the last X backups that will be kept based on your settings.

#### Restoring

We hope to make restoring simpler in future versions, for now you can find the backups in the `UPLOAD_LOCATION/backups` folder on your host.  
Then please follow the steps in the following section for restoring the database.

### Manual Backup and Restore

<Tabs>
  <TabItem value="Linux system" label="Linux system" default>

```bash title='Backup'
docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres | gzip > "/path/to/backup/dump.sql.gz"
```

```bash title='Restore'
docker compose down -v  # CAUTION! Deletes all Immich data to start from scratch
## Uncomment the next line and replace DB_DATA_LOCATION with your Postgres path to permanently reset the Postgres database
# rm -rf DB_DATA_LOCATION # CAUTION! Deletes all Immich data to start from scratch
docker compose pull             # Update to latest version of Immich (if desired)
docker compose create           # Create Docker containers for Immich apps without running them
docker start immich_postgres    # Start Postgres server
sleep 10                        # Wait for Postgres server to start up
# Check the database user if you deviated from the default
gunzip --stdout "/path/to/backup/dump.sql.gz" \
| sed "s/SELECT pg_catalog.set_config('search_path', '', false);/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', true);/g" \
| docker exec -i immich_postgres psql --dbname=postgres --username=<DB_USERNAME>  # Restore Backup
docker compose up -d            # Start remainder of Immich apps
```

</TabItem>
  <TabItem value="Windows system (PowerShell)" label="Windows system (PowerShell)">

```powershell title='Backup'
[System.IO.File]::WriteAllLines("C:\absolute\path\to\backup\dump.sql", (docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=postgres))
```

```powershell title='Restore'
docker compose down -v  # CAUTION! Deletes all Immich data to start from scratch
## Uncomment the next line and replace DB_DATA_LOCATION with your Postgres path to permanently reset the Postgres database
# Remove-Item -Recurse -Force DB_DATA_LOCATION # CAUTION! Deletes all Immich data to start from scratch
## You should mount the backup (as a volume, example: `- 'C:\path\to\backup\dump.sql:/dump.sql'`) into the immich_postgres container using the docker-compose.yml
docker compose pull                               # Update to latest version of Immich (if desired)
docker compose create                             # Create Docker containers for Immich apps without running them
docker start immich_postgres                      # Start Postgres server
sleep 10                                          # Wait for Postgres server to start up
docker exec -it immich_postgres bash              # Enter the Docker shell and run the following command
# Check the database user if you deviated from the default. If your backup ends in `.gz`, replace `cat` with `gunzip --stdout`
cat "/dump.sql" | sed "s/SELECT pg_catalog.set_config('search_path', '', false);/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', true);/g" | psql --dbname=postgres --username=<DB_USERNAME>
exit                                              # Exit the Docker shell
docker compose up -d                              # Start remainder of Immich apps
```

</TabItem>
</Tabs>

Note that for the database restore to proceed properly, it requires a completely fresh install (i.e. the Immich server has never run since creating the Docker containers). If the Immich app has run, Postgres conflicts may be encountered upon database restoration (relation already exists, violated foreign key constraints, multiple primary keys, etc.), in which case you need to delete the `DB_DATA_LOCATION` folder to reset the database.

:::tip
Some deployment methods make it difficult to start the database without also starting the server. In these cases, you may set the environment variable `DB_SKIP_MIGRATIONS=true` before starting the services. This will prevent the server from running migrations that interfere with the restore process. Be sure to remove this variable and restart the services after the database is restored.
:::

## Filesystem

Immich stores two types of content in the filesystem: (a) original, unmodified assets (photos and videos), and (b) generated content. We recommend backing up the entire contents of `UPLOAD_LOCATION`, but only the original content is critical, which is stored in the following folders:

1. `UPLOAD_LOCATION/library`
2. `UPLOAD_LOCATION/upload`
3. `UPLOAD_LOCATION/profile`

If you choose to back up only those folders, you will need to rerun the transcoding and thumbnail generation jobs for all assets after you restore from a backup.

:::caution
If you moved some of these folders onto a different storage device, such as `profile/`, make sure to adjust the backup path to match your setup
:::

### Asset Types and Storage Locations

Some storage locations are impacted by the Storage Template. See below for more details.

<Tabs>
  <TabItem value="Storage Template Off (Default)." label="Storage Template Off (Default)." default>

:::note
The `UPLOAD_LOCATION/library` folder is not used by default on new machines running version 1.92.0. It is used only if the system administrator activated the storage template engine,
for more info read the [release notes](https://github.com/immich-app/immich/releases/tag/v1.92.0#:~:text=the%20partner%E2%80%99s%20assets.-,Hardening%20storage%20template).
:::

**1. User-Specific Folders:**

- Each user has a unique string representing them.
- You can find your user ID in Account Account Settings -> Account -> User ID.

**2. Asset Types and Storage Locations:**

- **Source Assets:**
  - Original assets uploaded through the browser interface & mobile & CLI.
  - Stored in `UPLOAD_LOCATION/upload/<userID>`.
- **Avatar Images:**
  - User profile images.
  - Stored in `UPLOAD_LOCATION/profile/<userID>`.
- **Thumbs Images:**
  - Preview images (small thumbnails and large previews) for each asset and thumbnails for recognized faces.
  - Stored in `UPLOAD_LOCATION/thumbs/<userID>`.
- **Encoded Assets:**

  - Videos that have been re-encoded from the original for wider compatibility. The original is not removed.
  - Stored in `UPLOAD_LOCATION/encoded-video/<userID>`.

- **Postgres**

  - The Immich database containing all the information to allow the system to function properly.  
    **Note:** This folder will only appear to users who have made the changes mentioned in [v1.102.0](https://github.com/immich-app/immich/discussions/8930) (an optional, non-mandatory change) or who started with this version.
  - Stored in `DB_DATA_LOCATION`.

  :::danger
  A backup of this folder does not constitute a backup of your database!
  Follow the instructions listed [here](/docs/administration/backup-and-restore#database) to learn how to perform a proper backup.
  :::

</TabItem>
  <TabItem value="Storage Template On" label="Storage Template On">

:::note
If you choose to activate the storage template engine, it will move all assets to `UPLOAD_LOCATION/library/<userID>`.

When you turn off the storage template engine, it will leave the assets in `UPLOAD_LOCATION/library/<userID>` and will not return them to `UPLOAD_LOCATION/upload`.  
**New assets** will be saved to `UPLOAD_LOCATION/upload`.
:::

**1. User-Specific Folders:**

- Each user has a unique string representing them.
  - The administrator can set a Storage Label for a user, which will be used instead of `<userID>` for the `library/` folder.
  - The Admin has a default storage label of `admin`.
- You can find your user ID and Storage Label in Account Account Settings -> Account -> User ID.

**2. Asset Types and Storage Locations:**

- **Source Assets:**
  - Original assets uploaded through the browser interface, mobile, and CLI.
  - Stored in `UPLOAD_LOCATION/library/<userID>`.
- **Avatar Images:**
  - User profile images.
  - Stored in `UPLOAD_LOCATION/profile/<userID>`.
- **Thumbs Images:**
  - Preview images (blurred, small, large) for each asset and thumbnails for recognized faces.
  - Stored in `UPLOAD_LOCATION/thumbs/<userID>`.
- **Encoded Assets:**
  - Videos that have been re-encoded from the original for wider compatibility. The original is not removed.
  - Stored in `UPLOAD_LOCATION/encoded-video/<userID>`.
- **Files in Upload Queue (Mobile):**
  - Files uploaded through mobile apps.
  - Temporarily located in `UPLOAD_LOCATION/upload/<userID>`.
  - Transferred to `UPLOAD_LOCATION/library/<userID>` upon successful upload.
- **Postgres**

  - The Immich database containing all the information to allow the system to function properly.  
    **Note:** This folder will only appear to users who have made the changes mentioned in [v1.102.0](https://github.com/immich-app/immich/discussions/8930) (an optional, non-mandatory change) or who started with this version.
  - Stored in `DB_DATA_LOCATION`.

  :::danger
  A backup of this folder does not constitute a backup of your database!
  Follow the instructions listed [here](/docs/administration/backup-and-restore#database) to learn how to perform a proper backup.
  :::

</TabItem>

</Tabs>

:::danger
Do not touch the files inside these folders under any circumstances except taking a backup. Changing or removing an asset can cause untracked and missing files.
You can think of it as App-Which-Must-Not-Be-Named, the only access to viewing, changing and deleting assets is only through the mobile or browser interface.
:::
