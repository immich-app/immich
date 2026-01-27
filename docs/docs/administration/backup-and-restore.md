# Backup and Restore

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { mdiAlertCircle, mdiCheckCircle } from '@mdi/js';
import Icon from '@mdi/react';

A [3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/) is recommended to protect your data. You should keep copies of your uploaded photos/videos as well as the Immich database for a comprehensive backup solution. This page provides an overview on how to backup the database and the location of user-uploaded pictures and videos. A template bash script that can be run as a cron job is provided [here](/guides/template-backup-script.md)

:::danger
The instructions on this page show you how to prepare your Immich instance to be backed up, and which files to take a backup of. You still need to take care of using an actual backup tool to make a backup yourself.
:::

## Database

Immich stores [file paths](https://github.com/immich-app/immich/discussions/3299) and user metadata in the database. It does not scan the library folder, so database backups are essential.

### Automatic Database Backups

Immich automatically creates database backups for disaster-recovery purposes. These backups are stored in `UPLOAD_LOCATION/backups` and can be managed through the web interface.

You can adjust the backup schedule and retention settings in **Administration > Settings > Backup** (default: keep last 14 backups, create daily at 2:00 AM).

:::caution
Database backups do **not** contain photos or videos — only metadata. They must be used together with a copy of the files in `UPLOAD_LOCATION` as outlined below.
:::

#### Creating a Backup

You can trigger a database backup manually:

1. Go to **Administration > Job Queues**
2. Click **Create job** in the top right
3. Select **Create Database Backup** and click **Confirm**

The backup will appear in `UPLOAD_LOCATION/backups` and counts toward your retention limit.

### Restoring a Database Backup

Immich provides two ways to restore a database backup: through the web interface or via the command line. The web interface is the recommended method for most users.

#### Restore from Settings {#restore-from-settings}

If you have an existing Immich installation:

<img
src={require('./img/restore-from-settings.webp').default}
title="Restore from settings"
/>

1. Go to **Administration > Maintenance**
2. Expand the **Restore database backup** section
3. You'll see a list of available backups with their version and creation date
4. Click **Restore** next to the backup you want to restore
5. Confirm the restore operation

:::info
Restoring a backup will wipe the current database and replace it with the backup. A restore point is automatically created before the operation begins, allowing rollback if the restore fails.
:::

#### Restore from Onboarding {#restore-from-onboarding}

If you're setting up Immich on a fresh installation and want to restore from an existing backup:

1. Download and populate `.env` and `docker-compose.yml` as per the [installation instructions](/install/docker-compose).
2. Move the previous's instance data directories containing `backups`, `encoded-video`, `library`, `profile`, `thumbs` and `upload` into the new `UPLOAD_LOCATION`
3. **(For external libraries)** If you used external library feature in your previous instance, make sure that the mount settings in your new `docker-compose.yml` reflect the same structure. You may need to move files accordingly.

:::info Example

Assuming your previous `UPLOAD_LOCATION` was `UPLOAD_LOCATION=/my-broken-instance/media` and your new one is `UPLOAD_LOCATION=/a-brand-new-instance/data`, you will need to perform the following file moves:

```
/my-broken-instance/media/backups          ->    /a-brand-new-instance/data/backups
/my-broken-instance/media/encoded-video    ->    /a-brand-new-instance/data/encoded-video
/my-broken-instance/media/library          ->    /a-brand-new-instance/data/library
/my-broken-instance/media/profile          ->    /a-brand-new-instance/data/profile
/my-broken-instance/media/thumbs           ->    /a-brand-new-instance/data/thumbs
/my-broken-instance/media/upload           ->    /a-brand-new-instance/data/upload
```

:::

4. Start the Immich services with `docker compose up -d`

<img
src={require('./img/restore-from-onboarding.webp').default}
title="Restore from onboarding"
/>

5. On the welcome screen, click **Restore from backup**
6. Immich will enter maintenance mode and display integrity checks for your storage folders
7. Review the folder status to ensure your library files are accessible
8. Click **Next** to proceed to backup selection
9. Select a backup from the list or upload a backup file (`.sql.gz`)
10. Click **Restore** to begin the restoration process

:::tip
Before restoring, ensure your `UPLOAD_LOCATION` folders contain the same files that existed when the backup was created. The integrity check will show you which folders are readable/writable and how many files they contain.
:::

### Uploading a Backup File {#uploading-backup}

You can upload a database backup file directly:

1. In the **Restore database backup** section, click **Select from computer**
2. Choose a `.sql.gz` file
3. The uploaded backup will appear in the list with an `uploaded-` prefix
4. Click **Restore** to restore from the uploaded file

### Backup Version Compatibility {#backup-compatibility}

When viewing backups, Immich displays compatibility indicators based on the current version and the information from the filename:

- <Icon path={mdiCheckCircle} size={1} color="green"/> Backup version matches current Immich version
- <Icon path={mdiAlertCircle} size={1} color="#feb001"/> Backup was created with a different Immich version
- <Icon path={mdiAlertCircle} size={1} color="red"/> Could not determine backup version

:::warning
Restoring a backup from a different Immich version may require database migrations. The restore process will attempt to run migrations automatically, but you should ensure you're restoring to a compatible version when possible.
:::

### Restore Process {#restore-process}

During restoration, Immich will:

1. Create a backup of the current database (restore point)
2. Restore the selected backup
3. Run database migrations if needed
4. Perform a health check to verify the restore succeeded

If the restore fails (e.g., corrupted backup or missing admin user), Immich will automatically roll back to the restore point.

### Restore via Command Line {#restore-cli}

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
- **Database Dump Backups:**
  - Automatic database backups created by Immich for disaster recovery.
  - Stored in `UPLOAD_LOCATION/backups/`.
- **Postgres**
  - The Immich database containing all the information to allow the system to function properly.  
    **Note:** This folder will only appear to users who have made the changes mentioned in [v1.102.0](https://github.com/immich-app/immich/discussions/8930) (an optional, non-mandatory change) or who started with this version.
  - Stored in `DB_DATA_LOCATION`.

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
- **Database Dump Backups:**
  - Automatic database backups created by Immich for disaster recovery.
  - Stored in `UPLOAD_LOCATION/backups/`.
- **Postgres**
  - The Immich database containing all the information to allow the system to function properly.  
    **Note:** This folder will only appear to users who have made the changes mentioned in [v1.102.0](https://github.com/immich-app/immich/discussions/8930) (an optional, non-mandatory change) or who started with this version.
  - Stored in `DB_DATA_LOCATION`.

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
