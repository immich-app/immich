# Files Custom Locations

import ComposeBuilder from '/docs/partials/_compose-builder.mdx';

This guide explains how to store generated and raw files with docker's volume mount in different locations.

<ComposeBuilder query="storage.customFolders=true" />

:::caution Backup
It is important to remember to update the backup settings after following the guide to back up the new backup paths if using automatic backup tools, especially `profile/`.
:::

Edit the `docker-compose.yml` file to add new mount points to the `immich-server` container. These right side of the path is where the mount attaches inside of the container, so don't change those.
Note that you don't have to define all of these: UPLOAD_LOCATION will be the base folder that files are stored in by default, with the other paths acting as overrides.

```diff title="docker-compose.yml"
services:
  immich-server:
      volumes:
      - ${UPLOAD_LOCATION}:/data
+     - /disk/path/to/thumbs:/data/thumbs
+     - /disk/path/to/encoded-video:/data/encoded-video
+     - /disk/path/to/profile:/data/profile
+     - /disk/path/to/backups:/data/backups
      - /etc/localtime:/etc/localtime:ro
```

After making this change, you have to move the files over to the new folders to make sure Immich can find everything it needs.
If you haven't uploaded anything important yet, you can also reset Immich entirely by deleting the database folder.
Then restart Immich to register the changes:

```
docker compose up -d
```

:::note
Because of the underlying properties of docker bind mounts, it is not recommended to mount the `upload/` and `library/` folders as separate bind mounts if they are on the same device.
For this reason, we mount the HDD or the network storage (NAS) to `/data` and then mount the folders we want to access under that folder.

The `thumbs/` folder contains both the small thumbnails displayed in the timeline and the larger previews shown when clicking into an image. These cannot be separated.

The storage metrics of the Immich server will track available storage at `UPLOAD_LOCATION`, so the administrator must set up some sort of monitoring to ensure the storage does not run out of space.
The `profile/` folder is much smaller, usually less than 1 MB.
:::
