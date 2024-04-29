# Separate storage volumes

Because of the flexibility of the underlying Immich file structure, an administrator may prefer to store more frequently used assets (like thumbnails) on faster storage, such as an solid state drive (SSD),
while leaving the original files on a hard disk drive (HDD) or network storage.
This page outlines how this can be setup.

## Background

By default, all files (original pictures, thumbnails, encoded videos, and user profile pictures) are stored in `UPLOAD_LOCATION`.
In order to split up the file storage, the following volumes can be added to your Docker deployment.

While the exact size will depend on your original image sizes and ratio of videos to pictures, the `thumbs/` and `encoded-video/` folders can each be 10-20% the size of the entire library. The storage metrics of the Immich server will track the storage available at `UPLOAD_LOCATION`,
so the administrator should setup some kind of monitoring to make sure the SSD does not run out of space.

:::tip
Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the HDD or network storage to `/usr/src/app/upload` and then mount the folders we want quick access to below this folder.
If you prefer not to move all the folders, such as `encoded-video/`, you can leave that line out of your `docker-compose.yml` and they will remain in `UPLOAD_LOCATION`.
:::

## Setup

### Add this line to your .env file

```title='.env'
FASTSTORAGE_LOCATION='/path/to/ssd/storage/for/immich'
```

### Add these lines to the `volumes` section of your docker-compose.yml under _both_ immich-server and immich-microservices

```title='docker-compose.yml'
      - ${FASTSTORAGE_LOCATION}/profile:/usr/src/app/upload/profile
      - ${FASTSTORAGE_LOCATION}/thumbs:/usr/src/app/upload/thumbs
      - ${FASTSTORAGE_LOCATION}/encoded-video:/usr/src/app/upload/encoded-video
```

:::note
The `thumbs/` folder contains both the small thumbnails shown in the timeline, and the larger previews shown when clicking into an image. These cannot be split up.
:::

:::caution
If you setup the storage as outlined in this article, make sure to backup the `profile/` folder in `FASTSTORAGE_LOCATION` in addition to the files at `UPLOAD_LOCATION`.
:::
