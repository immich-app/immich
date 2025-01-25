# Files Custom Locations

This guide explains how to store generated and raw files with docker's volume mount in different locations.

:::caution Backup
It is important to remember to update the backup settings after following the guide to back up the new backup paths if using automatic backup tools, especially `profile/`.
:::

In our `.env` file, we will define variables that will help us in the future when we want to move to a more advanced server

```diff title=".env"
# You can find documentation for all the supported environment variables [here](/docs/install/environment-variables)

# Custom location where your uploaded, thumbnails, and transcoded video files are stored
- UPLOAD_LOCATION=./library
+ UPLOAD_LOCATION=/custom/path/immich/immich_files
+ THUMB_LOCATION=/custom/path/immich/thumbs
+ ENCODED_VIDEO_LOCATION=/custom/path/immich/encoded-video
+ PROFILE_LOCATION=/custom/path/immich/profile
+ BACKUP_LOCATION=/custom/path/immich/backups
...
```

After defining the locations of these files, we will edit the `docker-compose.yml` file accordingly and add the new variables to the `immich-server` container.

```diff title="docker-compose.yml"
services:
  immich-server:
      volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - ${THUMB_LOCATION}:/usr/src/app/upload/thumbs
+     - ${ENCODED_VIDEO_LOCATION}:/usr/src/app/upload/encoded-video
+     - ${PROFILE_LOCATION}:/usr/src/app/upload/profile
+     - ${BACKUP_LOCATION}:/usr/src/app/upload/backups
      - /etc/localtime:/etc/localtime:ro
```

Restart Immich to register the changes.

```
docker compose up -d
```

:::note
Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the HDD or the network storage (NAS) to `/usr/src/app/upload` and then mount the folders we want to access under that folder.

The `thumbs/` folder contains both the small thumbnails displayed in the timeline and the larger previews shown when clicking into an image. These cannot be separated.

The storage metrics of the Immich server will track available storage at `UPLOAD_LOCATION`, so the administrator must set up some sort of monitoring to ensure the storage does not run out of space. The `profile/` folder is much smaller, usually less than 1 MB.
:::
