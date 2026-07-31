# Docker

Immich is distributed as a set of container images and is run with [Docker](https://docs.docker.com/get-started/get-docker/) and the Docker Compose plugin. This page describes what Immich requires from Docker.

## Docker Engine vs Docker Desktop

Docker is available in two variants, and either satisfies Immich's requirement as long as the Compose plugin is present.

| Variant            | Description                           | Recommended for                                                    |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| **Docker Engine**  | The CLI variant, designed for servers | Linux (including Windows via WSL2). This is the recommended setup. |
| **Docker Desktop** | The GUI variant                       | Windows or macOS. **Not recommended** on Linux.                    |

## Docker Compose

Immich's deployment is defined as a Compose file, so the Compose plugin is required. It is installed by both Docker Engine and Docker Desktop when following their official installation guides, and can also be [installed separately](https://docs.docker.com/compose/install/).

:::note
Immich requires the `docker compose` command. The similarly named `docker-compose` is [deprecated](https://docs.docker.com/retired/#docker-compose-v1-replaced-by-compose-v2) and is no longer supported by Immich.
:::

## Containers

A default deployment runs the following containers:

| Container                 | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `immich_server`           | The API and web app, and the background [workers](/reference/workers)  |
| `immich_machine_learning` | Smart search, face detection, and OCR models                           |
| `immich_postgres`         | The database, including the vector extension used for search           |
| `immich_redis`            | The job queue (a [Valkey](https://valkey.io/) image, despite the name) |

## Container environments

Docker in LXC containers is [not recommended](https://pve.proxmox.com/wiki/Linux_Container), but may be possible for advanced users. Immich runs well in a full virtual machine. See [Requirements](/reference/requirements#os) for the supported combinations.

## Related pages

- [Install with Docker Compose](/install/docker-compose) — the recommended installation method
- [Inspect containers and logs](/administration/inspect-containers-and-logs) — day-to-day `docker` commands
- [Environment Variables](/reference/environment-variables) — what can be configured through the Compose environment
- [Storage locations](/reference/storage-locations) — what the mounted volumes hold
