import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Storage locations

Immich stores original assets, generated content, database dumps, and the database itself in separate directories. This page describes what each one holds. Some locations depend on whether the [storage template](/administration/use-the-storage-template) is enabled.

The root of this layout is `UPLOAD_LOCATION`; individual directories can be redirected elsewhere with the location environment variables documented in [Environment Variables](/reference/environment-variables). For which of these to include in a backup, see [Backups](/concepts/backups).

## Directories

<Tabs>
  <TabItem value="Storage Template Off (Default)." label="Storage Template Off (Default)." default>

:::note
The `UPLOAD_LOCATION/library` folder is not used by default on new machines running version 1.92.0. It is used only if the system administrator activated the storage template engine,
for more info read the [release notes](https://github.com/immich-app/immich/releases/tag/v1.92.0#:~:text=the%20partner%E2%80%99s%20assets.-,Hardening%20storage%20template).
:::

**User-specific folders**

- Each user has a unique string representing them.
- You can find your user ID in Account Account Settings -> Account -> User ID.

**Contents**

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

**User-specific folders**

- Each user has a unique string representing them.
  - The administrator can set a Storage Label for a user, which will be used instead of `<userID>` for the `library/` folder.
  - The Admin has a default storage label of `admin`.
- You can find your user ID and Storage Label in Account Account Settings -> Account -> User ID.

**Contents**

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

## Constraints

Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the HDD or the network storage (NAS) to `/data` and then mount the folders we want to access under that folder.

The `thumbs/` folder contains both the small thumbnails displayed in the timeline and the larger previews shown when clicking into an image. These cannot be separated.

The storage metrics of the Immich server will track available storage at `UPLOAD_LOCATION`, so the administrator must set up some sort of monitoring to ensure the storage does not run out of space. The `profile/` folder is much smaller, usually less than 1 MB.
