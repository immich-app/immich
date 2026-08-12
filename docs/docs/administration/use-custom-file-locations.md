# Use custom file locations

This guide explains how to store [generated and raw files](/reference/storage-locations) with docker's volume mount in different locations.

:::caution Backup
It is important to remember to update the backup settings after following the guide to back up the new backup paths if using automatic backup tools, especially `profile/`.
:::

In our `.env` file, we will define the paths we want to use. Note that you don't have to define all of these: UPLOAD_LOCATION will be the base folder that files are stored in by default, with the other paths acting as overrides.

```diff title=".env"
# You can find documentation for all the supported environment variables [here](/reference/environment-variables)

# Custom location where your uploaded, thumbnails, and transcoded video files are stored
- UPLOAD_LOCATION=./library
+ UPLOAD_LOCATION=/custom/path/immich/immich_files
+ THUMB_LOCATION=/custom/path/immich/thumbs
+ ENCODED_VIDEO_LOCATION=/custom/path/immich/encoded-video
+ PROFILE_LOCATION=/custom/path/immich/profile
+ BACKUP_LOCATION=/custom/path/immich/backups
...
```

After defining the locations of these files, we will edit the `docker-compose.yml` file accordingly and add the new variables to the `immich-server` container. These paths are where the mount attaches inside of the container, so don't change those.

```diff title="docker-compose.yml"
services:
  immich-server:
      volumes:
      - ${UPLOAD_LOCATION}:/data
+     - ${THUMB_LOCATION}:/data/thumbs
+     - ${ENCODED_VIDEO_LOCATION}:/data/encoded-video
+     - ${PROFILE_LOCATION}:/data/profile
+     - ${BACKUP_LOCATION}:/data/backups
      - /etc/localtime:/etc/localtime:ro
```

After making this change, you have to move the files over to the new folders to make sure Immich can find everything it needs. If you haven't uploaded anything important yet, you can also reset Immich entirely by deleting the database folder.
Then restart Immich to register the changes:

```
docker compose up -d
```

See [Storage locations](/reference/storage-locations) for what each directory holds and the constraints on splitting them across devices.
