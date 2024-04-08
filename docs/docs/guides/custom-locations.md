# Files Custom Locations

When using Immich you may want to select a specific location for thumbnails or transcoded videos in order to save disk space.
In this guide you will understand how you can define custom locations for the different types of files in Immich.

Some users may find this useful for higher system performance where the thumbnails images are on SSD and the original images are stored on HDD.

:::note Backup
It is important to remember after following the guide to update the backup settings to back up the new backup paths if using automatic backup tools.
:::
In our `.env` file we will define variables, they will help us in the future when we want to move to a more advanced server in the future

```diff title=".env"
# You can find documentation for all the supported env variables at https://immich.app/docs/install/environment-variables

# Custom location where your uploaded,thumbnails and transcoded videos files are stored
- {UPLOAD_LOCATION}./
+ {UPLOAD_LOCATION}=/custom/location/on/your/system/
+ {THUMB_LOCATION}=/custom/location/on/your/system/
+ {ENCODED_VIDEO_LOCATION}=/custom/location/on/your/system/
...
```

After we have defined the locations for these files, we will edit the `docker-compose.yml` file accordingly, and add the new vars to the immich-server, immich-microservices containers.

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

Restart Immich.

```
docker compose down
docker compose up -d
```

This guide shows only some of the customization options that can be applied, you can also set the following variables accordingly. More information about the folder structure in Immich can be found [here](/docs/administration/backup-and-restore#asset-types-and-storage-locations).

You can configure all or just some of the volumes, as needed. Variables should only be needed (in addition to UPLOAD_LOCATION) if you are trying to move specific sub-folders to another drive location, otherwise they'll show up inside of UPLOAD_LOCATION.

Thanks to [Jrasm91](https://github.com/immich-app/immich/discussions/2110#discussioncomment-5477767) for writing the guide.
