---
sidebar_position: 6
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

After removing the containers and volumes, the **Files** can be cleaned up (if necessary) from the `UPLOAD_LOCATION` by simply deleting an unwanted files or folders.

## Docker errors

### I am getting `Could not find image processor` ERROR class in ML containers what can i do?
:::note
This problem is irrelevant if Immich runs on a higher version from V1.91.5 and above
:::

if you getting this logs:

<details>
  <summary>Could not find image processor class in the image processor config or the model config.</summary>

```
2023-12-14 12:44:17 Could not find image processor class in the image processor config or the model config. Loading based on pattern matching with the model's feature extractor configuration.
ERROR [JobService] Unable to run job handler (objectTagging/classify-image): TypeError: fetch failed
ERROR [JobService] TypeError: fetch failed
at Object.fetch (node:internal/deps/undici/undici:11730:11)
at async MachineLearningRepository.post (/usr/src/app/dist/infra/repositories/machine-learning.repository.js:16:21)
at async SmartInfoService.handleClassifyImage (/usr/src/app/dist/domain/smart-info/smart-info.service.js:55:22)
at async /usr/src/app/dist/domain/job/job.service.js:112:37
at async Worker.processJob (/usr/src/app/node_modules/bullmq/dist/cjs/classes/worker.js:387:28)
at async Worker.retryIfFailed (/usr/src/app/node_modules/bullmq/dist/cjs/classes/worker.js:574:24)
```

</details>

It means the model could not be exported to ONNX. I think this error happens is specific to ARM devices. You can disable Image Tagging in the admin settings to avoid this issue[[1]](https://discord.com/channels/979116623879368755/1184823648364798092/1184823806708166696)