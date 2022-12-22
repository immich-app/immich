---
sidebar_position: 1
---

# Docker Help

## Logs

```bash title="Log Examples"
docker ps                         # see a list of running containers
docker ps -a                      # see a list of running and stopped containers
docker logs <id or name>          # see the logs for a specific container (by id or name)

docker logs immich_server
docker logs immich_microservices
docker logs immich_machine_learning
docker logs immich_web
docker logs immich_proxy
```

:::tip Follow a log
Adding `--follow` to a `docker logs <id or name>` command will stream new logs, instead of immediately exiting, which is often useful for debugging.
:::
