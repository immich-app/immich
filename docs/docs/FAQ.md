---
sidebar_position: 6
---

# FAQ

### What is the difference between the cloud icon on the mobile app?

| Icon                               | Description                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ![cloud](/img/cloud.svg)           | Asset is only available in the cloud and was uploaded from some other device (like the web client) or was deleted from this device after upload |
| ![cloud-cross](/img/cloud-off.svg) | Asset is only available locally and has not yet been backed up                                                                                  |
| ![cloud-done](/img/cloud-done.svg) | Asset was uploaded from this device and is now backed up in the cloud/server and still available in original on the device                      |

### How can I sync an existing directory with Immich's server?

Immich doesn't have the mechanism to sync an existing directory with the server. There is however, a helper CLI tool to help you bulk upload the existing photos and videos to the server. You can find the guide to use the CLI tool [here](/docs/features/bulk-upload.md).

### Why doesn't Immich watch an existing photo gallery directory?

The initial approach of Immich is to become a backup tool, primarily for mobile device usage. Thus, all the assets must be uploaded from the mobile client. The app was architectured to perform that job well.

### What happens to existing files after I choose a new [Storage Template](/docs/features/storage-template.mdx)?

Template changes will only apply to new assets. To retroactively apply the template to previously uploaded assets, run the Storage Migration Job, available on the [Jobs](/docs/features/jobs.md) page.

### Why is object detection not very good?

The model we used for machine learning is a prebuilt model, so the accuracy is not very good. It will hopefully be replaced with a better solution in the future.

### How can I see Immich logs?

Most Immich components are typically deployed using docker. To see logs for deployed docker containers, you can use the [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/), specifically the `docker logs` command. For examples, see [Docker Help](/docs/guides/docker-help.md)

### How can I run Immich as a non-root user?

1. Set the `PUID`/`PGID` environment variables (in `.env`).
2. Set the corresponding `user` argument in `docker-compose` for each service.
3. Add an additional volume to `immich-microservices` that mounts internally to `/usr/src/app/.reverse-geocoding-dump`.

The non-root user/group needs will need read/write access to the volume mounts, including `UPLOAD_LOCATION`.

### How can I reset the admin password?

The admin password can be reset by running the [reset-admin-password](/docs/features/server-commands.md) command on the immich-server.

### How can I **purge** data from Immich?

Data for Immich comes in two forms:

1. **Metadata** stored in a postgres database, persisted via the `pg_data` volume
2. **Files** (originals, thumbs, profile, etc.), stored in the `UPLOAD_LOCATION` folder.

To remove the **Metadata** you can stop Immich and delete the volume.

```bash title="Remove Immich (containers and volumes)"
docker-compose down -v
```

After removing the the containers and volumes, the **Files** can be cleaned up (if necessary) from the `UPLOAD_LOCATION` by simply deleting an unwanted files or folders.
