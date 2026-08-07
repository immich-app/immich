# Workers

A worker is an independent process inside the `immich-server` container. Which workers a container runs determines what work it takes on, which is what makes it possible to split responsibilities across containers or machines.

## Worker types

| Worker          | Responsibility                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `api`           | Responds to API requests for data and files from the web and mobile apps.                                |
| `microservices` | Runs the background [jobs](/reference/jobs) — thumbnail generation, video transcoding, machine learning. |

By default a container runs both.

A third worker, `maintenance`, is not selectable. It is started in place of the others while the instance is in [maintenance mode](/administration/use-maintenance-mode).

## Selecting workers

| Variable                 | Effect                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `IMMICH_WORKERS_INCLUDE` | Replaces the default set — only the listed workers run.                                   |
| `IMMICH_WORKERS_EXCLUDE` | Subtracts from the default set, or from `IMMICH_WORKERS_INCLUDE` when both are specified. |

Both accept a comma-separated list. An unrecognized worker name is a startup error: the server refuses to start rather than running a partial set.

To put these into practice, see [Split workers across containers](/administration/split-workers-across-containers). For running several containers at once, see [Scaling](/concepts/scaling).
