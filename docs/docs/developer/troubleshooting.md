# Troubleshooting

:::tip
A great option to get assistance with troubleshooting is to join our [Discord](https://discord.immich.app) server, where we have a dedicated channel for `#contributing`.
:::

## Known Issues

### Running on Windows

Running Immich on Windows can be frustrating and there are lots of ways it can go wrong. Where possible we recommend using Docker on Linux. However, several people have had success running Immich on Windows using Docker via WSL2.

### NTFS Mounted Volumes

The docker-compose.dev.yml and docker-compose.prod.yml use volume mounts for the postgres database. On start-up, postgres will try to `chown` the data directory, but fail. See [this post](https://forums.docker.com/t/data-directory-var-lib-postgresql-data-pgdata-has-wrong-ownership/17963/24) for more information about this issue and possible solutions.
