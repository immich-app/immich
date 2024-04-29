# Files Custom Locations

This guide explains storing generated and raw files with docker's volume mount in different locations.

:::caution Backup
It is important to remember to update the backup settings after following the guide to back up the new backup paths if using automatic backup tools, especially `profile/`.
:::

In our `.env` file, we will define variables that will help us in the future when we want to move to a more advanced server in the future

```diff title=".env"
# You can find documentation for all the supported env variables at https://immich.app/docs/install/environment-variables

# Custom location where your uploaded, thumbnails, and transcoded video files are stored
- UPLOAD_LOCATION=./library
+ UPLOAD_LOCATION=/custom/location/on/your/system/immich/immich_files
+ THUMB_LOCATION=/custom/location/on/your/system/immich/thumbs
+ ENCODED_VIDEO_LOCATION=/custom/location/on/your/system/immich/encoded-video
+ PROFILE_LOCATION=/custom/location/on/your/system/immich/profile
...
```

After defining the locations for these files, we will edit the `docker-compose.yml` file accordingly and add the new variables to the `immich-server` and `immich-microservices` containers.

```diff title="docker-compose.yml"
services:
  immich-server:
      volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - ${THUMB_LOCATION}:/usr/src/app/upload/thumbs
+     - ${ENCODED_VIDEO_LOCATION}:/usr/src/app/upload/encoded-video
+     - ${PROFILE_LOCATION}:/usr/src/app/upload/profile
      - /etc/localtime:/etc/localtime:ro

...

  immich-microservices:
      volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - ${THUMB_LOCATION}:/usr/src/app/upload/thumbs
+     - ${ENCODED_VIDEO_LOCATION}:/usr/src/app/upload/encoded-video
+     - ${PROFILE_LOCATION}:/usr/src/app/upload/profile
      - /etc/localtime:/etc/localtime:ro
```

Restart Immich to register the changes.

```
docker compose down
docker compose up -d
```

:::note
Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the HDD or network storage to `/usr/src/app/upload` and then mount the folders we want quick access to below this folder.

The `thumbs/` folder contains both the small thumbnails shown in the timeline, and the larger previews shown when clicking into an image. These cannot be split up.

The storage metrics of the Immich server will track the storage available at `UPLOAD_LOCATION`,
so the administrator should setup some kind of monitoring to make sure the SSD does not run out of space. The `profile/` folder is much smaller, typically less than 1 MB.
:::

Thanks to [Jrasm91](https://github.com/immich-app/immich/discussions/2110#discussioncomment-5477767) for writing the guide.
