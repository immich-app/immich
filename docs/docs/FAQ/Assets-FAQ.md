---
sidebar_position: 3
---

# Assets

### Can I add my existing photo library?

Yes, with an [external library](/docs/features/libraries.md).

### What happens to existing files after I choose a new [Storage Template](/docs/administration/storage-template.mdx)?

Template changes will only apply to new assets. To retroactively apply the template to previously uploaded assets, run the Storage Migration Job, available on the [Jobs](/docs/administration/jobs.md) page.

### Why are only photos and not videos being uploaded to Immich?

This often happens when using a reverse proxy or cloudflare tunnel in front of Immich. Make sure to set your reverse proxy to allow large POST requests. In `nginx`, set `client_max_body_size 50000M;` or similar. Also check the disk space of your reverse proxy, in some cases proxies caches requests to disk before passing them on, and if disk space runs out the request fails.

### In the uploads folder, why are photos stored in the wrong date?

This is fixed by running the storage migration job.

### How can I backup data from Immich?

See [backup and restore](/docs/administration/backup-and-restore.md).

### Does Immich supports reading faces tags from the Exif?

not at this moment

### Does Immich support filtering of images defined as NSFW?

As of now, this option is not implemented, but it seems that there is an [open discussion about it
On Github](https://github.com/immich-app/immich/discussions/2451) you can submit a pull request or vote for the discussion

### Why are there so many thumbnail generation jobs?

Immich generates three thumbnails for each asset (blurred, small, and large), as well as a thumbnail for each recognized face.

### How can I move all data (photos, persons, albums) from one user to another?

This requires some database queries. You can do this on the command line (in the PostgreSQL container using the psql command), or you can add for example an [Adminer](https://www.adminer.org/) container to the `docker-compose.yml` file, so that you can use a web-interface.

:::warning
This is an advanced operation. If you can't to do it with the steps described here, this is not for you.
:::

1. **MAKE A BACKUP** - See [backup and restore](/docs/administration/backup-and-restore.md).
2. Find the id of both the 'source' and the 'destination' user (it's the id column in the users table)
3. Three tables need to be updated:

   ```sql
   // reassign albums
   UPDATE albums SET "ownerId" = '<destinationId>' WHERE "ownerId" = '<sourceId>';

   // reassign people
   UPDATE person SET "ownerId" = '<destinationId>' WHERE "ownerId" = '<sourceId>';

   // reassign assets
   UPDATE assets SET "ownerId" = '<destinationId>' WHERE "ownerId" = '<sourceId>'
    AND CHECKSUM NOT IN (SELECT CHECKSUM FROM assets WHERE "ownerId" = '<destinationId>');
   ```
4. There might be left-over assets in the 'source' user's library if they are skipped by the last query because of duplicate checksums. These are probably duplicates anyway, and can probably be removed.