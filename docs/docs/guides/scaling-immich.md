# Scaling Immich

Immich is built with modern deployment practices in mind, and the backend is designed to be able to run multiple instances in parallel. When doing this, the only requirement you need to be aware of is that every instance needs to be connected to the shared infrastructure. That means they should all have access to the same Postgres and Redis instances, and have the same files mounted into the containers.

Scaling can be useful for many reasons. Maybe you have a gaming PC that you want to use for transcoding and thumbnail generation, or perhaps you run a Kubernetes cluster across a handful of powerful servers that you want to make use of.

:::info
If you only have a single machine to run Immich on, scaling to multiple containers is unlikely to provide any benefit. An Immich container will run multiple background tasks at once, and you can increase their number from the admin panel.
:::

The details of how to scale across multiple machines will vary widely between different environments and require some knowledge to set up, and as such this guide gives no specific instructions. In some cases scaling up can be as easy as incrementing the amount of replicas on a Kubernetes deployment, in others it might need you to configure network tunnels or NFS mounts. The details are left as an exercise for the reader ;)

## Workers

By default, each running `immich-server` container comes with multiple internal workers. If you're scaling up only to handle more background tasks, you can choose to disable the worker responsible for the API. See [workers](../administration/jobs-workers.md) for more detail.

## Scaling down

In the same way you can scale up to multiple containers, you can also choose to scale down. All state is stored in Postgres, Redis, and the filesystem so there is no risk in stopping a running immich-server container, for example if you want to use your GPU to play some games. As long as there is an API worker running you will still be able to browse Immich, and jobs will wait to be processed until there is a worker available for them.
