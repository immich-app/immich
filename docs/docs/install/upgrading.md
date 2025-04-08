---
sidebar_position: 95
---

# Upgrading

:::danger Read the release notes
Immich is currently under heavy development, which means you can expect [breaking changes][breaking] and bugs. You should read the release notes prior to updating and take special care when using automated tools like [Watchtower][watchtower].

You can see versions that had breaking changes [here][breaking].
:::

When a new version of Immich is [released][releases], you should read the release notes and account for any breaking changes noted (as mentioned above).
If you use `IMMICH_VERSION` in your `.env` file, it will need to be updated to the latest or desired version.
After that, the application can be upgraded and restarted with the following commands, run in the directory with the `docker-compose.yml` file:

```bash title="Upgrade and restart Immich"
docker compose pull && docker compose up -d
```

To clean up disk space, the old version's obsolete container images can be deleted with the following command:

```bash title="Clean up unused Docker images"
docker image prune
```

[compose-file]: https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
[env-file]: https://github.com/immich-app/immich/releases/latest/download/example.env
[watchtower]: https://containrrr.dev/watchtower/
[breaking]: https://github.com/immich-app/immich/discussions?discussions_q=label%3Achangelog%3Abreaking-change+sort%3Adate_created
[container-auth]: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry
[releases]: https://github.com/immich-app/immich/releases
