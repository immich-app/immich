---
sidebar_position: 8
---

# Docker

## Docker General

### How can I see Immich logs?

Most Immich components are typically deployed using docker. To see logs for deployed docker containers, you can use the [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/), specifically the `docker logs` command. For examples, see [Docker Help](/docs/guides/docker-help.md)

### How can I run Immich as a non-root user?

1. Set the `PUID`/`PGID` environment variables (in `.env`).
2. Set the corresponding `user` argument in `docker-compose` for each service.
3. Add an additional volume to `immich-microservices` that mounts internally to `/usr/src/app/.reverse-geocoding-dump`.

The non-root user/group needs read/write access to the volume mounts, including `UPLOAD_LOCATION`.

### How can I **purge** data from Immich?

Data for Immich comes in two forms:

1. **Metadata** stored in a postgres database, persisted via the `pg_data` volume
2. **Files** (originals, thumbs, profile, etc.), stored in the `UPLOAD_LOCATION` folder.

To remove the **Metadata** you can stop Immich and delete the volume.

```bash title="Remove Immich (containers and volumes)"
docker compose down -v
```

After removing the containers and volumes, the **Files** can be cleaned up (if necessary) from the `UPLOAD_LOCATION` by simply deleting any unwanted files or folders.

## Docker errors

### Why does the machine learning service report workers crashing?

:::note
If the error says the worker is exiting, then this is normal. This is a feature intended to reduce RAM consumption when the service isn't being used.
:::

There are a few reasons why this can happen.

If the error mentions SIGKILL or error code 137, it most likely means the service is running out of memory. Consider either increasing the server's RAM or moving the service to a server with more RAM.

If it mentions SIGILL (note the lack of a K) or error code 132, it most likely means your server's CPU is incompatible. This is unlikely to occur on version 1.92.0 or later. Consider upgrading if your version of Immich is below that.

If your version of Immich is below 1.92.0 and the crash occurs after logs about tracing or exporting a model, consider either upgrading or disabling the Tag Objects job.