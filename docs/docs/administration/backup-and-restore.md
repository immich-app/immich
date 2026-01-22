# Backup and Restore

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A [3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/) is recommended to protect your data. You should keep copies of your uploaded photos/videos as well as the Immich database for a comprehensive backup solution. This page provides an overview on how to backup the database and the location of user-uploaded pictures and videos. A template bash script that can be run as a cron job is provided [here](/guides/template-backup-script.md)

## Database

Immich stores [file paths in the database](https://github.com/immich-app/immich/discussions/3299), users metadata in the database, it does not scan the library folder, so database backups are essential

### Automatic Database Backups

Immich automatically creates database backups for disaster-recovery purposes. These backups are stored in `UPLOAD_LOCATION/backups` and can be managed through the web interface.

You can adjust the backup schedule and retention settings in **Administration > Settings > Backup** (default: keep last 14 backups, create daily at 2:00 AM).

:::caution
Database backups do **NOT** contain photos or videos — only metadata. They must be used together with a copy of the files in `UPLOAD_LOCATION` as outlined below.
:::

#### Creating a Backup

You can trigger a database backup manually:

1. Go to **Administration > Queues**
2. Click **Create job** in the top right
3. Select **Create Database Backup** and click **Confirm**

The backup will appear in `UPLOAD_LOCATION/backups` and counts toward your retention limit.

### Restoring a Database Backup

Immich provides two ways to restore a database backup: through the web interface or via the command line.

#### Restore via Web Interface

You can restore a database backup directly from the Immich web interface. This is the recommended method for most users.

##### From Settings (Existing Installation)

1. Go to **Administration > Maintenance**
2. Expand the **Restore database backup** section
3. You'll see a list of available backups with their version and creation date
4. Click **Restore** next to the backup you want to restore
5. Confirm the restore operation

:::warning
Restoring a backup will wipe the current database and replace it with the backup. A restore point is automatically created before the operation begins, allowing rollback if the restore fails.
:::

##### From Onboarding (Fresh Installation)

If you're setting up Immich on a fresh installation and want to restore from an existing backup:

1. On the welcome screen, click **Restore from backup**
2. Immich will enter maintenance mode and display integrity checks for your storage folders
3. Review the folder status to ensure your library files are accessible
4. Click **Next** to proceed to backup selection
5. Select a backup from the list or upload a backup file (`.sql.gz`)
6. Click **Restore** to begin the restoration process

:::tip
Before restoring, ensure your `UPLOAD_LOCATION` folders contain the same files that existed when the backup was created. The integrity check will show you which folders are readable/writable and how many files they contain.
:::

##### Uploading a Backup File

You can upload a database backup file directly:

1. In the **Restore database backup** section, click **Select from computer**
2. Choose a `.sql.gz` file
3. The uploaded backup will appear in the list with an "uploaded-" prefix
4. Click **Restore** to restore from the uploaded file

##### Backup Version Compatibility

When viewing backups, Immich displays compatibility indicators:

- ✅ **Green checkmark**: Backup version matches current Immich version
- ⚠️ **Warning**: Backup was created with a different Immich version
- ❌ **Error**: Could not determine backup version

:::warning
Restoring a backup from a different Immich version may require database migrations. The restore process will attempt to run migrations automatically, but you should ensure you're restoring to a compatible version when possible.
:::

##### Restore Process

During restoration, Immich will:

1. Create a backup of the current database (restore point)
2. Restore the selected backup
3. Run database migrations if needed
4. Perform a health check to verify the restore succeeded

If the restore fails (e.g., corrupted backup or missing admin user), Immich will automatically roll back to the restore point.

#### Restore via Command Line

For advanced users or automated recovery scenarios, you can restore a database backup using the command line.

<Tabs>
  <TabItem value="Linux system" label="Linux system" default>

```bash title='Backup'
# Replace <DB_USERNAME> with the database username - usually postgres unless you have changed it.
docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=<DB_USERNAME> | gzip > "/path/to/backup/dump.sql.gz"
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
# Replace <DB_USERNAME> with the database username - usually postgres unless you have changed it.
gunzip --stdout "/path/to/backup/dump.sql.gz" \
| sed "s/SELECT pg_catalog.set_config('search_path', '', false);/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', true);/g" \
| docker exec -i immich_postgres psql --dbname=postgres --username=<DB_USERNAME>  # Restore Backup
docker compose up -d            # Start remainder of Immich apps
```

  </TabItem>
  <TabItem value="Windows system (PowerShell)" label="Windows system (PowerShell)">

```powershell title='Backup'
# Replace <DB_USERNAME> with the database username - usually postgres unless you have changed it.
[System.IO.File]::WriteAllLines("C:\absolute\path\to\backup\dump.sql", (docker exec -t immich_postgres pg_dumpall --clean --if-exists --username=<DB_USERNAME>))
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
# If your backup ends in `.gz`, replace `cat` with `gunzip --stdout`
# Replace <DB_USERNAME> with the database username - usually postgres unless you have changed it.

cat "/dump.sql" | sed "s/SELECT pg_catalog.set_config('search_path', '', false);/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', true);/g" | psql --dbname=postgres --username=<DB_USERNAME>
exit                                              # Exit the Docker shell
docker compose up -d                              # Start remainder of Immich apps
```

  </TabItem>
</Tabs>

:::note
For the database restore to proceed properly, it requires a completely fresh install (i.e., the Immich server has never run since creating the Docker containers). If the Immich app has run, you may encounter Postgres conflicts (relation already exists, violated foreign key constraints, etc.). In this case, delete the `DB_DATA_LOCATION` folder to reset the database.
:::

:::tip
Some deployment methods make it difficult to start the database without also starting the server. In these cases, set the environment variable `DB_SKIP_MIGRATIONS=true` before starting the services. This prevents the server from running migrations that interfere with the restore process. Remove this variable and restart services after the database is restored.
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
  Follow the instructions listed [here](/administration/backup-and-restore#database) to learn how to perform a proper backup.
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
  Follow the instructions listed [here](/administration/backup-and-restore#database) to learn how to perform a proper backup.
  :::

</TabItem>

</Tabs>

:::danger
Do not touch the files inside these folders under any circumstances except taking a backup. Changing or removing an asset can cause untracked and missing files.
You can think of it as App-Which-Must-Not-Be-Named, the only access to viewing, changing and deleting assets is only through the mobile or browser interface.
:::

## Backup ordering

A backup of Immich should contain both the database and the asset files. When backing these up it's possible for them to get out of sync, potentially resulting in broken assets after you restore.  
The best way of dealing with this is to stop the immich-server container while you take a backup. If nothing is changing then the backup will always be in sync.

If stopping the container is not an option, then the recommended order is to back up the database first, and the filesystem second. This way, the worst case scenario is that there are files on the filesystem that the database doesn't know about. If necessary, these can be (re)uploaded manually after a restore. If the backup is done the other way around, with the filesystem first and the database second, it's possible for the restored database to reference files that aren't in the filesystem backup, thus resulting in broken assets.
