# Scaling

Immich is built to scale. Rather than a single process doing everything, the server is divided into independent **workers**, and most of the actual work is expressed as **jobs** that are queued and processed in the background. That division is what makes it possible to run Immich on one small machine or spread it across several.

## Why the server is divided

Serving the timeline and processing a video are very different workloads. One needs to answer quickly and constantly; the other is slow, CPU-hungry, and can be deferred. Running both in one undivided process means a transcoding backlog degrades browsing.

Splitting them apart is what avoids that:

- The `api` worker handles requests from the web and mobile apps.
- The `microservices` worker runs the jobs — thumbnail generation, transcoding, machine learning, and everything else that happens after an upload.

Because the two are separate processes coordinating only through Postgres and Redis, they do not have to run together. A single container runs both by default, but they can be split across containers, or across machines, with each set pointed at the same shared infrastructure.

## Why work is expressed as jobs

Treating background work as discrete, queued jobs has consequences beyond scheduling:

- Work survives restarts, because the queue is durable rather than in-memory.
- Progress is observable and jobs can be re-run, which is what makes it possible to reprocess a library after changing a setting.
- Each kind of work gets its own concurrency limit, so an expensive job type cannot starve the rest.
- Jobs can depend on each other, forming an order that is followed for every asset.

## Running multiple instances

The backend is designed so that multiple instances of its [workers](/reference/workers) can run in parallel. The only hard requirement is that every instance is connected to the same shared infrastructure: the same Postgres and Redis instances, and the same files mounted into the containers.

This is useful when the hardware you have is uneven. You might have a gaming PC you want to use for transcoding and thumbnail generation, or a Kubernetes cluster of a few powerful servers you want to make use of.

If you are scaling up only to get through background work faster, you can run additional containers with the API worker disabled so they do nothing but process jobs — see [Split workers across containers](/administration/split-workers-across-containers).

:::info
If you only have a single machine to run Immich on, scaling to multiple containers is unlikely to provide any benefit. An Immich container already runs multiple background tasks at once, and their [concurrency](/reference/jobs#concurrency) can be raised from the admin panel.
:::

How to actually scale across machines varies widely between environments and takes some knowledge to set up, so there is no single recipe. In some cases it is as easy as incrementing the replica count on a Kubernetes deployment; in others it means configuring network tunnels or NFS mounts.

## Scaling down

The same properties allow scaling in the other direction. All state lives in Postgres, Redis, and the filesystem, so stopping a running `immich-server` container carries no risk — for example, to free up a GPU for something else.

As long as one API worker is running, Immich remains browsable, and jobs simply wait in their queues until a worker is available to process them.

## Where to go next

- [Jobs](/reference/jobs) — every job, what it does, and the order they run in
- [Workers](/reference/workers) — the worker types and how to select them
- [Split workers across containers](/administration/split-workers-across-containers)
