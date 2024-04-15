# Files Custom Locations

This guide explains storing generated and raw files with docker's volume mount in different locations.

:::note Backup
It is important to remember to update the backup settings after following the guide to back up the new backup paths if using automatic backup tools.
:::

In our `.env` file, we will define variables that will help us in the future when we want to move to a more advanced server in the future

```diff title=".env"
# You can find documentation for all the supported env variables at https://immich.app/docs/install/environment-variables

# Custom location where your uploaded, thumbnails, and transcoded video files are stored
- {UPLOAD_LOCATION}./
+ {UPLOAD_LOCATION}=/custom/location/on/your/system/
+ {THUMB_LOCATION}=/custom/location/on/your/system/
+ {ENCODED_VIDEO_LOCATION}=/custom/location/on/your/system/
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
      - /etc/localtime:/etc/localtime:ro

...

  immich-microservices:
      volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - ${THUMB_LOCATION}:/usr/src/app/upload/thumbs
+     - ${ENCODED_VIDEO_LOCATION}:/usr/src/app/upload/encoded-video
      - /etc/localtime:/etc/localtime:ro
```

Restart Immich to register the changes.

```
docker compose down
docker compose up -d
```

Thanks to [Jrasm91](https://github.com/immich-app/immich/discussions/2110#discussioncomment-5477767) for writing the guide.
