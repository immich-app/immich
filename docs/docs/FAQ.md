---
sidebar_position: 7
---

# FAQ

### What is the difference between the cloud icon on the mobile app?

| Icon                               | Description                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ![cloud](/img/cloud.svg)           | Asset is only available in the cloud and was uploaded from some other device (like the web client) or was deleted from this device after upload |
| ![cloud-cross](/img/cloud-off.svg) | Asset is only available locally and has not yet been backed up                                                                                  |
| ![cloud-done](/img/cloud-done.svg) | Asset was uploaded from this device and is now backed up in the cloud/server and still available in original on the device                      |

### Can I add my existing photo library?

Yes, with an [external library](/docs/features/libraries.md).

### Why are only photos and not videos being uploaded to Immich?

This often happens when using a reverse proxy or cloudflare tunnel in front of Immich. Make sure to set your reverse proxy to allow large POST requests. In `nginx`, set `client_max_body_size 50000M;` or similar. Cloudflare tunnels are limited to 100 mb file sizes. Also check the disk space of your reverse proxy, in some cases proxies caches requests to disk before passing them on, and if disk space runs out the request fails.

### Why is Immich slow on low-memory systems like the Raspberry Pi?

Immich optionally uses machine learning for several features. However, it can be too heavy to run on a Raspberry Pi. You can [mitigate](/docs/FAQ#how-can-i-lower-immichs-cpu-usage) this or [disable](/docs/FAQ.md#how-can-i-disable-machine-learning) machine learning entirely.

### How can I lower Immich's CPU usage?

The initial backup is the most intensive due to the number of jobs running. The most CPU-intensive ones are transcoding and machine learning jobs (Tag Images, Smart Search, Recognize Faces), and to a lesser extent thumbnail generation. Here are some ways to lower their CPU usage:

- Lower the job concurrency for these jobs to 1.
- Under Settings > Transcoding Settings > Threads, set the number of threads to a low number like 1 or 2.
- Under Settings > Machine Learning Settings > Facial Recognition > Model Name, you can change the facial recognition model to `buffalo_s` instead of `buffalo_l`. The former is a smaller and faster model, albeit not as good.
  - You _must_ re-run the Recognize Faces job for all images after this for facial recognition on new images to work properly.
- If these changes are not enough, see [below](/docs/FAQ.md#how-can-i-disable-machine-learning) for how you can disable machine learning.

### How can I disable machine learning?

:::info
Disabling machine learning will result in a poor experience for searching and the 'Explore' page, as these are reliant on it to work as intended.
:::

Machine learning can be disabled under Settings > Machine Learning Settings, either entirely or by model type. For instance, you can choose to disable smart search with CLIP, but keep facial recognition enabled. This means that the machine learning service will only process the enabled jobs.

However, disabling all jobs will not disable the machine learning service itself. To prevent it from starting up at all in this case, you can comment out the `immich-machine-learning` section of the docker-compose.yml.

### I'm getting errors about models being corrupt or failing to download. What do I do?

You can delete the model cache volume, which is where models are downloaded. This will give the service a clean environment to download the model again.

### What happens to existing files after I choose a new [Storage Template](/docs/administration/storage-template.mdx)?

Template changes will only apply to new assets. To retroactively apply the template to previously uploaded assets, run the Storage Migration Job, available on the [Jobs](/docs/administration/jobs.md) page.

### In the uploads folder, why are photos stored in the wrong date?

This is fixed by running the storage migration job.

### Why is object detection not very good?

The default image tagging model is relatively small. You can change this for a larger model like `google/vit-base-patch16-224` by setting the model name under Settings > Machine Learning Settings > Image Tagging. You can then re-run the Image Tagging job to get improved tags.

### Why are there so many thumbnail generation jobs?

Immich generates three thumbnails for each asset (blurred, small, and large), as well as a thumbnail for each recognized face.

### How can I see Immich logs?

Most Immich components are typically deployed using docker. To see logs for deployed docker containers, you can use the [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/), specifically the `docker logs` command. For examples, see [Docker Help](/docs/guides/docker-help.md)

### How can I run Immich as a non-root user?

1. Set the `PUID`/`PGID` environment variables (in `.env`).
2. Set the corresponding `user` argument in `docker-compose` for each service.
3. Add an additional volume to `immich-microservices` that mounts internally to `/usr/src/app/.reverse-geocoding-dump`.

The non-root user/group needs read/write access to the volume mounts, including `UPLOAD_LOCATION`.

### How can I reset the admin password?

The admin password can be reset by running the [reset-admin-password](/docs/administration/server-commands.md) command on the immich-server.

### How can I backup data from Immich?

See [backup and restore](/docs/administration/backup-and-restore.md).

### How can I **purge** data from Immich?

Data for Immich comes in two forms:

1. **Metadata** stored in a postgres database, persisted via the `pg_data` volume
2. **Files** (originals, thumbs, profile, etc.), stored in the `UPLOAD_LOCATION` folder.

To remove the **Metadata** you can stop Immich and delete the volume.

```bash title="Remove Immich (containers and volumes)"
docker-compose down -v
```

After removing the containers and volumes, the **Files** can be cleaned up (if necessary) from the `UPLOAD_LOCATION` by simply deleting an unwanted files or folders.

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
   update albums set "ownerId" = '<destinationId>' where "ownerId" = '<sourceId>';

   // reassign people
   update person set "ownerId" = '<destinationId>' where "ownerId" = '<sourceId>';

   // reassign assets
   update assets set "ownerId" = '<destinationId>' where "ownerId" = '<sourceId>'
    and checksum not in (select checksum from assets where "ownerId" = '<destinationId>');
   ```

4. There might be left-over assets in the 'source' user's library if they are skipped by the last query because of duplicate checksums. These are probably duplicates anyway, and can probably be removed.
