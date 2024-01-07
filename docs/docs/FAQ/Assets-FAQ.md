---
sidebar_position: 3
---

# Assets

### Can I add my existing photo library?

Yes, with an [External Library](/docs/features/libraries.md).

### What happens to existing files after I choose a new [Storage Template](/docs/administration/storage-template.mdx)?

Template changes will only apply to _new_ assets. To retroactively apply the template to previously uploaded assets, run the Storage Migration Job, available on the [Jobs](/docs/administration/jobs.md) page.

### Why are only photos and not videos being uploaded to Immich?

This often happens when using a reverse proxy (such as nginx or Cloudflare tunnel) in front of Immich. Make sure to set your reverse proxy to allow large `POST` requests. In `nginx`, set `client_max_body_size 50000M;` or similar. Also check the disk space of your reverse proxy, in some cases proxies cache requests to disk before passing them on, and if disk space runs out the request fails.

### Why are some photos stored in the file system with the wrong date?

There are a few different scenarios that can lead to this situation. The solution is to simply run the storage migration job again. The job is only _automatically_ run once per asset, after upload. If metadata extraction originally failed, the jobs were cleared/cancelled, etc. the job may not have run automatically the first time.

### How can I hide photos from the timeline?

You can _archive_ them.

### How can I backup data from Immich?

See [Backup and Restore](/docs/administration/backup-and-restore.md).

### Does Immich support reading existing face tag metadata?

No, it currently does not.

### Does Immich support filtering of NSFW images?

No, it currently does not, but there is an [open discussion about it On Github](https://github.com/immich-app/immich/discussions/2451). You can submit a pull request or vote for the discussion.

### Why are there so many thumbnail generation jobs?

There are three thubmanil jobs for each asset:

- Blurred (thumbhash)
- Small (webp)
- Large (jpeg)

Also, there are additional jobs for person (face) thumbnails.

### What happens if an asset exists in more than one account?

There are no requirements for assets to be unique across users. If multiple users upload the same image they are processed as if they were distinct assets and jobs run and thumbnails are generated accordingly.

### How can I delete transcoded videos without deleting the original?

The transcode of an asset can be deleted by setting a transcode policy that makes it unnecessary, then running a transcoding job for that asset. This can be done on a per-asset basis by starting a transcoding job for an asset (with the _Refresh encoded videos_ button in the asset viewer options. Or, for all assets by running transcoding jobs for all assets.

To update the transcode policy, navigate to Administration > Video Transcoding Settings > Transcoding Policy and select a policy from the drop-down. This policy will determine whether an existing transcode will be deleted or overwritten in the transcoding job. If a video should be transcoded according to this policy, an existing transcode is overwritten. If not, then it is deleted.

:::note
For example, say you have existing transcodes with the policy "Videos higher than normal resolution or not in the desired format" and switch to a narrower policy: "Videos not in the desired format". If an asset was only transcoded due to its resolution, then running a transcoding job for it will now delete the existing transcode. This is because resolution is no longer part of the transcode policy and the transcode is unnecessary as a result. Likewise, if you set the policy to "Don't transcode any videos" and run transcoding jobs for all assets, this will delete all existing transcodes as they are all unnecessary.
:::

### Is it possible to compress images during backup?

No. Our golden rule is that the original assets should always be untouched, so we don't think this feature is a good fit for Immich.

### How can I move all data (photos, persons, albums) from one user to another?

This is not officially supported, but can be accomplished with some database updates. You can do this on the command line (in the PostgreSQL container using the psql command), or you can add for example an [Adminer](https://www.adminer.org/) container to the `docker-compose.yml` file, so that you can use a web-interface.

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
