---
sidebar_position: 90
---

# Environment Variables

:::caution

To change environment variables, you must recreate the Immich containers.
Just restarting the containers does not replace the environment within the container!

In order to recreate the container using docker compose, run `docker compose up -d`.
In most cases docker will recognize that the `.env` file has changed and recreate the affected containers.
If this should not work, try running `docker compose up -d --force-recreate`.

:::

## Docker Compose

| Variable           | Description                     |  Default  | Containers               |
| :----------------- | :------------------------------ | :-------: | :----------------------- |
| `IMMICH_VERSION`   | Image tags                      | `release` | server, machine learning |
| `UPLOAD_LOCATION`  | Host Path for uploads           |           | server                   |
| `DB_DATA_LOCATION` | Host Path for Postgres database |           | database                 |

:::tip
These environment variables are used by the `docker-compose.yml` file and do **NOT** affect the containers directly.
:::

## General

| Variable                            | Description                                                                               |           Default            | Containers               | Workers            |
| :---------------------------------- | :---------------------------------------------------------------------------------------- | :--------------------------: | :----------------------- | :----------------- |
| `TZ`                                | Timezone                                                                                  |        <sup>\*1</sup>        | server                   | microservices      |
| `IMMICH_ENV`                        | Environment (production, development)                                                     |         `production`         | server, machine learning | api, microservices |
| `IMMICH_LOG_LEVEL`                  | Log Level (verbose, debug, log, warn, error)                                              |            `log`             | server, machine learning | api, microservices |
| `IMMICH_MEDIA_LOCATION`             | Media Location inside the container ⚠️**You probably shouldn't set this**<sup>\*2</sup>⚠️ |   `./upload`<sup>\*3</sup>   | server                   | api, microservices |
| `IMMICH_CONFIG_FILE`                | Path to config file                                                                       |                              | server                   | api, microservices |
| `NO_COLOR`                          | Set to `true` to disable color-coded log output                                           |           `false`            | server, machine learning |                    |
| `CPU_CORES`                         | Amount of cores available to the immich server                                            | auto-detected cpu core count | server                   |                    |
| `IMMICH_API_METRICS_PORT`           | Port for the OTEL metrics                                                                 |            `8081`            | server                   | api                |
| `IMMICH_MICROSERVICES_METRICS_PORT` | Port for the OTEL metrics                                                                 |            `8082`            | server                   | microservices      |
| `IMMICH_PROCESS_INVALID_IMAGES`     | When `true`, generate thumbnails for invalid images                                       |                              | server                   | microservices      |
| `IMMICH_TRUSTED_PROXIES`            | List of comma separated IPs set as trusted proxies                                        |                              | server                   | api                |
| `IMMICH_IGNORE_MOUNT_CHECK_ERRORS`  | See [System Integrity](/docs/administration/system-integrity)                             |                              | server                   | api, microservices |

\*1: `TZ` should be set to a `TZ identifier` from [this list][tz-list]. For example, `TZ="Etc/UTC"`.
`TZ` is used by `exiftool` as a fallback in case the timezone cannot be determined from the image metadata. It is also used for logfile timestamps and cron job execution.

\*2: This path is where the Immich code looks for the files, which is internal to the docker container. Setting it to a path on your host will certainly break things, you should use the `UPLOAD_LOCATION` variable instead.

\*3: With the default `WORKDIR` of `/usr/src/app`, this path will resolve to `/usr/src/app/upload`.
It only need to be set if the Immich deployment method is changing.

## Workers

| Variable                 | Description                                                                                          | Default | Containers |
| :----------------------- | :--------------------------------------------------------------------------------------------------- | :-----: | :--------- |
| `IMMICH_WORKERS_INCLUDE` | Only run these workers.                                                                              |         | server     |
| `IMMICH_WORKERS_EXCLUDE` | Do not run these workers. Matches against default workers, or `IMMICH_WORKERS_INCLUDE` if specified. |         | server     |

:::info
Information on the current workers can be found [here](/docs/administration/jobs-workers).
:::

## Ports

| Variable      | Description    |                  Default                   |
| :------------ | :------------- | :----------------------------------------: |
| `IMMICH_HOST` | Listening host |                 `0.0.0.0`                  |
| `IMMICH_PORT` | Listening port | `2283` (server), `3003` (machine learning) |

## Database

| Variable                            | Description                                                              |   Default    | Containers                     |
| :---------------------------------- | :----------------------------------------------------------------------- | :----------: | :----------------------------- |
| `DB_URL`                            | Database URL                                                             |              | server                         |
| `DB_HOSTNAME`                       | Database Host                                                            |  `database`  | server                         |
| `DB_PORT`                           | Database Port                                                            |    `5432`    | server                         |
| `DB_USERNAME`                       | Database User                                                            |  `postgres`  | server, database<sup>\*1</sup> |
| `DB_PASSWORD`                       | Database Password                                                        |  `postgres`  | server, database<sup>\*1</sup> |
| `DB_DATABASE_NAME`                  | Database Name                                                            |   `immich`   | server, database<sup>\*1</sup> |
| `DB_VECTOR_EXTENSION`<sup>\*2</sup> | Database Vector Extension (one of [`pgvector`, `pgvecto.rs`])            | `pgvecto.rs` | server                         |
| `DB_SKIP_MIGRATIONS`                | Whether to skip running migrations on startup (one of [`true`, `false`]) |   `false`    | server                         |

\*1: The values of `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE_NAME` are passed to the Postgres container as the variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` in `docker-compose.yml`.

\*2: This setting cannot be changed after the server has successfully started up.

:::info

All `DB_` variables must be provided to all Immich workers, including `api` and `microservices`.

`DB_URL` must be in the format `postgresql://immichdbusername:immichdbpassword@postgreshost:postgresport/immichdatabasename`.
You can require SSL by adding `?sslmode=require` to the end of the `DB_URL` string, or require SSL and skip certificate verification by adding `?sslmode=require&sslmode=no-verify`.

When `DB_URL` is defined, the `DB_HOSTNAME`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` and `DB_DATABASE_NAME` database variables are ignored.

:::

## Redis

| Variable         | Description    | Default | Containers |
| :--------------- | :------------- | :-----: | :--------- |
| `REDIS_URL`      | Redis URL      |         | server     |
| `REDIS_SOCKET`   | Redis Socket   |         | server     |
| `REDIS_HOSTNAME` | Redis Host     | `redis` | server     |
| `REDIS_PORT`     | Redis Port     | `6379`  | server     |
| `REDIS_USERNAME` | Redis Username |         | server     |
| `REDIS_PASSWORD` | Redis Password |         | server     |
| `REDIS_DBINDEX`  | Redis DB Index |   `0`   | server     |

:::info
All `REDIS_` variables must be provided to all Immich workers, including `api` and `microservices`.

`REDIS_URL` must start with `ioredis://` and then include a `base64` encoded JSON string for the configuration.
More info can be found in the upstream [ioredis] documentation.

When `REDIS_URL` or `REDIS_SOCKET` are defined, the `REDIS_HOSTNAME`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, and `REDIS_DBINDEX` variables are ignored.
:::

Redis (Sentinel) URL example JSON before encoding:

<details>
<summary>JSON</summary>

```json
{
  "sentinels": [
    {
      "host": "redis-sentinel-node-0",
      "port": 26379
    },
    {
      "host": "redis-sentinel-node-1",
      "port": 26379
    },
    {
      "host": "redis-sentinel-node-2",
      "port": 26379
    }
  ],
  "name": "redis-sentinel"
}
```

</details>

## Machine Learning

| Variable                                                  | Description                                                                                         |                Default                | Containers       |
| :-------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :-----------------------------------: | :--------------- |
| `MACHINE_LEARNING_MODEL_TTL`                              | Inactivity time (s) before a model is unloaded (disabled if \<= 0)                                  |                 `300`                 | machine learning |
| `MACHINE_LEARNING_MODEL_TTL_POLL_S`                       | Interval (s) between checks for the model TTL (disabled if \<= 0)                                   |                 `10`                  | machine learning |
| `MACHINE_LEARNING_CACHE_FOLDER`                           | Directory where models are downloaded                                                               |               `/cache`                | machine learning |
| `MACHINE_LEARNING_REQUEST_THREADS`<sup>\*1</sup>          | Thread count of the request thread pool (disabled if \<= 0)                                         |          number of CPU cores          | machine learning |
| `MACHINE_LEARNING_MODEL_INTER_OP_THREADS`                 | Number of parallel model operations                                                                 |                  `1`                  | machine learning |
| `MACHINE_LEARNING_MODEL_INTRA_OP_THREADS`                 | Number of threads for each model operation                                                          |                  `2`                  | machine learning |
| `MACHINE_LEARNING_WORKERS`<sup>\*2</sup>                  | Number of worker processes to spawn                                                                 |                  `1`                  | machine learning |
| `MACHINE_LEARNING_HTTP_KEEPALIVE_TIMEOUT_S`<sup>\*3</sup> | HTTP Keep-alive time in seconds                                                                     |                  `2`                  | machine learning |
| `MACHINE_LEARNING_WORKER_TIMEOUT`                         | Maximum time (s) of unresponsiveness before a worker is killed                                      | `120` (`300` if using OpenVINO image) | machine learning |
| `MACHINE_LEARNING_PRELOAD__CLIP`                          | Name of a CLIP model to be preloaded and kept in cache                                              |                                       | machine learning |
| `MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION`            | Name of a facial recognition model to be preloaded and kept in cache                                |                                       | machine learning |
| `MACHINE_LEARNING_ANN`                                    | Enable ARM-NN hardware acceleration if supported                                                    |                `True`                 | machine learning |
| `MACHINE_LEARNING_ANN_FP16_TURBO`                         | Execute operations in FP16 precision: increasing speed, reducing precision (applies only to ARM-NN) |                `False`                | machine learning |
| `MACHINE_LEARNING_ANN_TUNING_LEVEL`                       | ARM-NN GPU tuning level (1: rapid, 2: normal, 3: exhaustive)                                        |                  `2`                  | machine learning |
| `MACHINE_LEARNING_DEVICE_IDS`<sup>\*4</sup>               | Device IDs to use in multi-GPU environments                                                         |                  `0`                  | machine learning |

\*1: It is recommended to begin with this parameter when changing the concurrency levels of the machine learning service and then tune the other ones.

\*2: Since each process duplicates models in memory, changing this is not recommended unless you have abundant memory to go around.

\*3: For scenarios like HPA in K8S. https://github.com/immich-app/immich/discussions/12064

\*4: Using multiple GPUs requires `MACHINE_LEARNING_WORKERS` to be set greater than 1. A single device is assigned to each worker in round-robin priority.

:::info

Other machine learning parameters can be tuned from the admin UI.

:::

## Prometheus

| Variable                       | Description                                                                                   | Default | Containers | Workers            |
| :----------------------------- | :-------------------------------------------------------------------------------------------- | :-----: | :--------- | :----------------- |
| `IMMICH_METRICS`<sup>\*1</sup> | Toggle all metrics (one of [`true`, `false`])                                                 |         | server     | api, microservices |
| `IMMICH_API_METRICS`           | Toggle metrics for endpoints and response times (one of [`true`, `false`])                    |         | server     | api, microservices |
| `IMMICH_HOST_METRICS`          | Toggle metrics for CPU and memory utilization for host and process (one of [`true`, `false`]) |         | server     | api, microservices |
| `IMMICH_IO_METRICS`            | Toggle metrics for database queries, image processing, etc. (one of [`true`, `false`])        |         | server     | api, microservices |
| `IMMICH_JOB_METRICS`           | Toggle metrics for jobs and queues (one of [`true`, `false`])                                 |         | server     | api, microservices |

\*1: Overridden for a metric group when its corresponding environmental variable is set.

## Docker Secrets

The following variables support the use of [Docker secrets][docker-secrets] for additional security.

To use any of these, replace the regular environment variable with the equivalent `_FILE` environment variable. The value of
the `_FILE` variable should be set to the path of a file containing the variable value.

| Regular Variable   | Equivalent Docker Secrets '\_FILE' Variable |
| :----------------- | :------------------------------------------ |
| `DB_HOSTNAME`      | `DB_HOSTNAME_FILE`<sup>\*1</sup>            |
| `DB_DATABASE_NAME` | `DB_DATABASE_NAME_FILE`<sup>\*1</sup>       |
| `DB_USERNAME`      | `DB_USERNAME_FILE`<sup>\*1</sup>            |
| `DB_PASSWORD`      | `DB_PASSWORD_FILE`<sup>\*1</sup>            |
| `DB_URL`           | `DB_URL_FILE`<sup>\*1</sup>                 |
| `REDIS_PASSWORD`   | `REDIS_PASSWORD_FILE`<sup>\*2</sup>         |

\*1: See the [official documentation][docker-secrets-docs] for
details on how to use Docker Secrets in the Postgres image.

\*2: See [this comment][docker-secrets-example] for an example of how
to use use a Docker secret for the password in the Redis container.

[tz-list]: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List
[docker-secrets-example]: https://github.com/docker-library/redis/issues/46#issuecomment-335326234
[docker-secrets-docs]: https://github.com/docker-library/docs/tree/master/postgres#docker-secrets
[docker-secrets]: https://docs.docker.com/engine/swarm/secrets/
[ioredis]: https://ioredis.readthedocs.io/en/latest/README/#connect-to-redis
