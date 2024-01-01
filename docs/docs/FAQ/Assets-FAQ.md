---
sidebar_position: 3
---

# Assets

### Can I add my existing photo library?

Yes, with an [external library](/docs/features/libraries.md).

### What happens to existing files after I choose a new [Storage Template](/docs/administration/storage-template.mdx)?

Template changes will only apply to new assets. To retroactively apply the template to previously uploaded assets, run the Storage Migration Job, available on the [Jobs](/docs/administration/jobs.md) page.

### Why are only photos and not videos being uploaded to Immich?

This often happens when using a reverse proxy (such as nginx or Cloudflare tunnel) in front of Immich. Make sure to set your reverse proxy to allow large POST requests. In `nginx`, set `client_max_body_size 50000M;` or similar. Also check the disk space of your reverse proxy, in some cases proxies cache requests to disk before passing them on, and if disk space runs out the request fails.

### In the uploads folder, why are photos stored in the wrong date?

This is fixed by running the storage migration job.

### How can I hide photos from the timeline?

You can archive them.

### How can I backup data from Immich?

See [backup and restore](/docs/administration/backup-and-restore.md).

### Does Immich supports reading faces tags from exif?

For now, it doesn't.

### Does Immich support filtering of NSFW images?

This option is not implemented, but there is an [open discussion about it
On Github](https://github.com/immich-app/immich/discussions/2451). You can submit a pull request or vote for the discussion.

### Why are there so many thumbnail generation jobs?

Immich generates three thumbnails for each asset (blurred, small, and large), as well as a thumbnail for each recognized face.

### What happens if an asset exists in more than one account?

All machine learning jobs and thumbnail images are recreated.


### Is it possible to use item compression like in App-Which-Must-Not-Be-Named?

No. There was a discussion about this in the past but it was [rejected](https://github.com/immich-app/immich/pull/1242), there is an [unofficial way to achieve this](https://gist.github.com/JamesCullum/6604e504318dd326a507108f59ca7dcd).

:::danger
If you do choose to use the unofficial way, it's important to be aware of the following security risks:

- The golang:1.19.4-alpine3.17 base image was released a year ago and has [18 vulnerabilities for OpenSSL](https://hub.docker.com/layers/library/golang/1.19.4-alpine3.17/images/sha256-8b532e4f43b6ccab31b2542d132720aa6e22f6164e0ed9d4885ef2d7c8b87aa5?context=explore)
- The image `ghcr.io/jamescullum/multipart-upload-proxy:main` was last updated a long time ago and has vulnerable versions of OpenSSL and libwebp.
- The vips-dev package relies on libwebp, which had a major CVE a few months ago.
There may be other vulnerabilities as well.
:::

### How can I move all data (photos, persons, albums) from one user to another?

This requires some database queries. You can do this on the command line (in the PostgreSQL container using the psql command), or you can add for example an [Adminer](https://www.adminer.org/) container to the `docker-compose.yml` file, so that you can use a web-interface.

:::warning
This is an advanced operation. If you can't do it with the steps described here, this is not for you.
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