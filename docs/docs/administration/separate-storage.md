# Separate storage volumes

Because of the flexibility of the underlying Immich file structure, an administrator may prefer to store more frequently used assets (like thumbnails) on faster storage, such as an solid state drive,
while leaving the original files on a hard disk drive or network storage.
This page outlines how this can be setup.

## Background

By default, all files (original pictures, thumbnails, encoded videos, and user profile pictures) are stored in `UPLOAD_LOCATION`.
In order to split up the file storage, the following volumes can be added to your Docker deployment.

:::tip
Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the hard drive or network storage to `/usr/src/app/upload` and then mount the folders we want quick access to below this folder.
If you prefer not to move all the folders, such as `encoded-video`, you can leave that line out of your `docker-compose.yml` and they will remain in `UPLOAD_LOCATION`.
:::

## Setup

```title='Add this line to your .env file'
FASTSTORAGE_LOCATION='/path/to/ssd/storage/for/immich'
```

```title='Add these lines to docker-compose.yml for immich-server and immich-microservices'
      - ${FASTSTORAGE_LOCATION}/profile:/usr/src/app/upload/profile
      - ${FASTSTORAGE_LOCATION}/thumbs:/usr/src/app/upload/thumbs
      - ${FASTSTORAGE_LOCATION}/encoded-video:/usr/src/app/upload/encoded-video
```

:::note
The `thumbs/` folder contains both the small thumbnails shown in the timeline, and the larger previews shown when clicking into an image. These cannot be split up.
:::
