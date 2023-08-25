---
sidebar_position: 90
---

# Environment Variables

## Docker Compose

| Variable          | Description           |  Default  | Services                                                       |
| :---------------- | :-------------------- | :-------: | :------------------------------------------------------------- |
| `IMMICH_VERSION`  | Image tags            | `release` | server, microservices, machine learning, web, proxy, typesense |
| `UPLOAD_LOCATION` | Host Path for uploads |           | server, microservices                                          |

:::tip

These environment variables are used by the `docker-compose.yml` file and do **NOT** affect the containers directly.

:::

## General

| Variable                    | Description                                  |   Default    | Services                                     |
| :-------------------------- | :------------------------------------------- | :----------: | :------------------------------------------- |
| `TZ`                        | Timezone                                     |              | microservices                                |
| `NODE_ENV`                  | Environment (production, development)        | `production` | server, microservices, machine learning, web |
| `LOG_LEVEL`                 | Log Level (verbose, debug, log, warn, error) |    `log`     | server, microservices                        |
| `IMMICH_MEDIA_LOCATION`     | Media Location                               |  `./upload`  | server, microservices                        |
| `PUBLIC_LOGIN_PAGE_MESSAGE` | Public Login Page Message                    |              | web                                          |
| `IMMICH_CONFIG_FILE`        | Path to config file                          |              | server                                       |

:::tip

`TZ` is only used by the `exiftool` as a fallback in case the timezone cannot be determined from the image metadata.

`exiftool` is only present in the microservices container.

:::

## Geocoding

| Variable                           | Description                         |           Default            | Services      |
| :--------------------------------- | :---------------------------------- | :--------------------------: | :------------ |
| `DISABLE_REVERSE_GEOCODING`        | Disable Reverse Geocoding Precision |           `false`            | microservices |
| `REVERSE_GEOCODING_PRECISION`      | Reverse Geocoding Precision         |             `3`              | microservices |
| `REVERSE_GEOCODING_DUMP_DIRECTORY` | Reverse Geocoding Dump Directory    | `./.reverse-geocoding-dump/` | microservices |

## Ports

| Variable                | Description           | Default | Services         |
| :---------------------- | :-------------------- | :-----: | :--------------- |
| `PORT`                  | Web Port              | `3000`  | web              |
| `SERVER_PORT`           | Server Port           | `3001`  | server           |
| `MICROSERVICES_PORT`    | Microservices Port    | `3002`  | microservices    |
| `MACHINE_LEARNING_PORT` | Machine Learning Port | `3003`  | machine learning |

## URLs

| Variable                          | Description                  |                Default                | Services              |
| :-------------------------------- | :--------------------------- | :-----------------------------------: | :-------------------- |
| `IMMICH_WEB_URL`                  | Immich Web URL               |       `http://immich-web:3000`        | proxy                 |
| `IMMICH_SERVER_URL`               | Immich Server URL            |      `http://immich-server:3001`      | web, proxy            |
| `IMMICH_MACHINE_LEARNING_ENABLED` | Enabled machine learning     |                `true`                 | server, microservices |
| `IMMICH_MACHINE_LEARNING_URL`     | Immich Machine Learning URL, | `http://immich-machine-learning:3003` | server, microservices |
| `PUBLIC_IMMICH_SERVER_URL`        | Public Immich URL            |      `http://immich-server:3001`      | web                   |
| `IMMICH_API_URL_EXTERNAL`         | Immich API URL External      |                `/api`                 | web                   |

:::info

The above paths are modifying the internal paths of the containers.

:::

## Database

| Variable      | Description       |   Default   | Services              |
| :------------ | :---------------- | :---------: | :-------------------- |
| `DB_URL`      | Database URL      |             | server, microservices |
| `DB_HOSTNAME` | Database Host     | `localhost` | server, microservices |
| `DB_PORT`     | Database Port     |   `5432`    | server, microservices |
| `DB_USERNAME` | Database User     | `postgres`  | server, microservices |
| `DB_PASSWORD` | Database Password | `postgres`  | server, microservices |
| `DB_DATABASE` | Database Name     |  `immich`   | server, microservices |

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

## Typesense

| Variable             | Description              |   Default   | Services                         |
| :------------------- | :----------------------- | :---------: | :------------------------------- |
| `TYPESENSE_ENABLED`  | Enable Typesense         |             | server, microservices            |
| `TYPESENSE_URL`      | Typesense URL            |             | server, microservices            |
| `TYPESENSE_HOST`     | Typesense Host           | `typesense` | server, microservices            |
| `TYPESENSE_PORT`     | Typesense Port           |   `8108`    | server, microservices            |
| `TYPESENSE_PROTOCOL` | Typesense Protocol       |   `http`    | server, microservices            |
| `TYPESENSE_API_KEY`  | Typesense API Key        |             | server, microservices, typesense |
| `TYPESENSE_DATA_DIR` | Typesense Data Directory |   `/data`   | typesense                        |

:::info

`TYPESENSE_URL` must start with `ha://` and then include a `base64` encoded JSON string for the configuration.

`TYPESENSE_ENABLED`: Anything other than `false`, behaves as `true`.
Even undefined is treated as `true`.

- When `TYPESENSE_URL` is defined, the other typesense (`TYPESENSE_*`) variables are ignored.

:::

Typesense URL example JSON before encoding:

```json
[
  {
    "host": "typesense-1.example.net",
    "port": "443",
    "protocol": "https"
  },
  {
    "host": "typesense-2.example.net",
    "port": "443",
    "protocol": "https"
  },
  {
    "host": "typesense-3.example.net",
    "port": "443",
    "protocol": "https"
  }
]
```

## Machine Learning

| Variable                                    | Description                    |        Default        | Services         |
| :------------------------------------------ | :----------------------------- | :-------------------: | :--------------- |
| `MACHINE_LEARNING_MIN_FACE_SCORE`           | Minimum Face Score             |         `0.7`         | machine learning |
| `MACHINE_LEARNING_MODEL_TTL`                | Model TTL                      |         `300`         | machine learning |
| `MACHINE_LEARNING_EAGER_STARTUP`            | Eager Startup                  |        `true`         | machine learning |
| `MACHINE_LEARNING_MIN_TAG_SCORE`            | Minimum Tag Score              |         `0.9`         | machine learning |
| `MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL` | Facial Recognition Model       |      `buffalo_l`      | machine learning |
| `MACHINE_LEARNING_CLIP_TEXT_MODEL`          | Clip Text Model                |    `clip-ViT-B-32`    | machine learning |
| `MACHINE_LEARNING_CLIP_IMAGE_MODEL`         | Clip Image Model               |    `clip-ViT-B-32`    | machine learning |
| `MACHINE_LEARNING_CLASSIFICATION_MODEL`     | Classification Model           | `microsoft/resnet-50` | machine learning |
| `MACHINE_LEARNING_CACHE_FOLDER`             | ML Cache Location              |       `/cache`        | machine learning |
| `TRANSFORMERS_CACHE`                        | ML Transformers Cache Location |       `/cache`        | machine learning |

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
