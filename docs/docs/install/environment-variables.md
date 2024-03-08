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

| Variable          | Description           |  Default  | Services                                            |
| :---------------- | :-------------------- | :-------: | :-------------------------------------------------- |
| `IMMICH_VERSION`  | Image tags            | `release` | server, microservices, machine learning, web, proxy |
| `UPLOAD_LOCATION` | Host Path for uploads |           | server, microservices                               |

:::tip

These environment variables are used by the `docker-compose.yml` file and do **NOT** affect the containers directly.

:::

## General

| Variable                        | Description                                  |       Default        | Services                                     |
| :------------------------------ | :------------------------------------------- | :------------------: | :------------------------------------------- |
| `TZ`                            | Timezone                                     |                      | microservices                                |
| `NODE_ENV`                      | Environment (production, development)        |     `production`     | server, microservices, machine learning, web |
| `LOG_LEVEL`                     | Log Level (verbose, debug, log, warn, error) |        `log`         | server, microservices                        |
| `IMMICH_MEDIA_LOCATION`         | Media Location                               |      `./upload`      | server, microservices                        |
| `IMMICH_CONFIG_FILE`            | Path to config file                          |                      | server                                       |
| `IMMICH_WEB_ROOT`               | Path of root index.html                      |  `/usr/src/app/www`  | server                                       |
| `IMMICH_REVERSE_GEOCODING_ROOT` | Path of reverse geocoding dump directory     | `/usr/src/resources` | microservices                                |

:::tip

`TZ` is only used by the `exiftool` as a fallback in case the timezone cannot be determined from the image metadata.

`exiftool` is only present in the microservices container.

:::

## Ports

| Variable                | Description           |  Default  | Services         |
| :---------------------- | :-------------------- | :-------: | :--------------- |
| `PORT`                  | Web Port              |  `3000`   | web              |
| `SERVER_PORT`           | Server Port           |  `3001`   | server           |
| `MICROSERVICES_PORT`    | Microservices Port    |  `3002`   | microservices    |
| `MACHINE_LEARNING_HOST` | Machine Learning Host | `0.0.0.0` | machine learning |
| `MACHINE_LEARNING_PORT` | Machine Learning Port |  `3003`   | machine learning |

## Database

| Variable                            | Description                                                   |   Default    | Services              |
| :---------------------------------- | :------------------------------------------------------------ | :----------: | :-------------------- |
| `DB_URL`                            | Database URL                                                  |              | server, microservices |
| `DB_HOSTNAME`                       | Database Host                                                 | `localhost`  | server, microservices |
| `DB_PORT`                           | Database Port                                                 |    `5432`    | server, microservices |
| `DB_USERNAME`                       | Database User                                                 |  `postgres`  | server, microservices |
| `DB_PASSWORD`                       | Database Password                                             |  `postgres`  | server, microservices |
| `DB_DATABASE_NAME`                  | Database Name                                                 |   `immich`   | server, microservices |
| `DB_VECTOR_EXTENSION`<sup>\*1</sup> | Database Vector Extension (one of [`pgvector`, `pgvecto.rs`]) | `pgvecto.rs` | server, microservices |

\*1: This setting cannot be changed after the server has successfully started up

:::info

When `DB_URL` is defined, the other database (`DB_*`) variables are ignored.

:::

## Redis

| Variable         | Description    |    Default     | Services              |
| :--------------- | :------------- | :------------: | :-------------------- |
| `REDIS_URL`      | Redis URL      |                | server, microservices |
| `REDIS_HOSTNAME` | Redis Host     | `immich_redis` | server, microservices |
| `REDIS_PORT`     | Redis Port     |     `6379`     | server, microservices |
| `REDIS_DBINDEX`  | Redis DB Index |      `0`       | server, microservices |
| `REDIS_USERNAME` | Redis Username |                | server, microservices |
| `REDIS_PASSWORD` | Redis Password |                | server, microservices |
| `REDIS_SOCKET`   | Redis Socket   |                | server, microservices |

:::info

`REDIS_URL` must start with `ioredis://` and then include a `base64` encoded JSON string for the configuration.
More info can be found in the upstream [ioredis](https://ioredis.readthedocs.io/en/latest/API/) documentation.

- When `REDIS_URL` is defined, the other redis (`REDIS_*`) variables are ignored.
- When `REDIS_SOCKET` is defined, the other redis (`REDIS_*`) variables are ignored.

:::

Redis (Sentinel) URL example JSON before encoding:

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

## Machine Learning

| Variable                                         | Description                                                          |       Default       | Services         |
| :----------------------------------------------- | :------------------------------------------------------------------- | :-----------------: | :--------------- |
| `MACHINE_LEARNING_MODEL_TTL`                     | Inactivity time (s) before a model is unloaded (disabled if \<= 0)   |        `300`        | machine learning |
| `MACHINE_LEARNING_MODEL_TTL_POLL_S`              | Interval (s) between checks for the model TTL (disabled if \<= 0)    |        `10`         | machine learning |
| `MACHINE_LEARNING_CACHE_FOLDER`                  | Directory where models are downloaded                                |      `/cache`       | machine learning |
| `MACHINE_LEARNING_REQUEST_THREADS`<sup>\*1</sup> | Thread count of the request thread pool (disabled if \<= 0)          | number of CPU cores | machine learning |
| `MACHINE_LEARNING_MODEL_INTER_OP_THREADS`        | Number of parallel model operations                                  |         `1`         | machine learning |
| `MACHINE_LEARNING_MODEL_INTRA_OP_THREADS`        | Number of threads for each model operation                           |         `2`         | machine learning |
| `MACHINE_LEARNING_WORKERS`<sup>\*2</sup>         | Number of worker processes to spawn                                  |         `1`         | machine learning |
| `MACHINE_LEARNING_WORKER_TIMEOUT`                | Maximum time (s) of unresponsiveness before a worker is killed       |        `120`        | machine learning |
| `MACHINE_LEARNING_PRELOAD__CLIP`                 | Name of a CLIP model to be preloaded and kept in cache               |                     | machine learning |
| `MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION`   | Name of a facial recognition model to be preloaded and kept in cache |                     | machine learning |

\*1: It is recommended to begin with this parameter when changing the concurrency levels of the machine learning service and then tune the other ones.

\*2: Since each process duplicates models in memory, changing this is not recommended unless you have abundant memory to go around.

:::info

Other machine learning parameters can be tuned from the admin UI.

:::

## Docker Secrets

The following variables support the use of [Docker secrets](https://docs.docker.com/engine/swarm/secrets/) for additional security.

To use any of these, replace the regular environment variable with the equivalent `_FILE` environment variable. The value of
the `_FILE` variable should be set to the path of a file containing the variable value.

|  Regular Variable  | Equivalent Docker Secrets '\_FILE' Variable |
| :----------------: | :-----------------------------------------: |
|   `DB_HOSTNAME`    |      `DB_HOSTNAME_FILE`<sup>\*1</sup>       |
| `DB_DATABASE_NAME` |    `DB_DATABASE_NAME_FILE`<sup>\*1</sup>    |
|   `DB_USERNAME`    |      `DB_USERNAME_FILE`<sup>\*1</sup>       |
|   `DB_PASSWORD`    |      `DB_PASSWORD_FILE`<sup>\*1</sup>       |
|  `REDIS_PASSWORD`  |     `REDIS_PASSWORD_FILE`<sup>\*2</sup>     |

\*1: See the [official documentation](https://github.com/docker-library/docs/tree/master/postgres#docker-secrets) for
details on how to use Docker Secrets in the Postgres image.

\*2: See [this comment](https://github.com/docker-library/redis/issues/46#issuecomment-335326234) for an example of how
to use use a Docker secret for the password in the Redis container.
