# Environment Variables

## General

| Variable                      | Description                                  |                   Default                   | Services                                |
| :---------------------------- | :------------------------------------------- | :-----------------------------------------: | :-------------------------------------- |
| `TZ`                          | Timezone                                     |                     ``                      | microservices                           |
| `NODE_ENV`                    | Environment (production, development)        |                `production`                 | server, microservices, machine learning |
| `LOG_LEVEL`                   | Log Level (verbose, debug, log, warn, error) |                    `log`                    | server, microservices                   |
| `DISABLE_REVERSE_GEOCODING`   | Disable Reverse Geocoding Precision          |                   `false`                   | microservices                           |
| `REVERSE_GEOCODING_PRECISION` | Reverse Geocoding Precision                  |                     `3`                     | microservices                           |
| `PUBLIC_LOGIN_PAGE_MESSAGE`   | Public Login Page Message                    | `My Family Photos and Videos Backup Server` | web                                     |

> `TZ` is only used by the `exiftool` in the microservices container.
> It is considered as a fallback timezone if the timezone cannot be determined from the image metadata.

## Ports

| Variable                | Description           | Default | Services         |
| :---------------------- | :-------------------- | :-----: | :--------------- |
| `PORT`                  | Web Port              | `3000`  | web              |
| `SERVER_PORT`           | Server Port           | `3001`  | server           |
| `MICROSERVICES_PORT`    | Microservices Port    | `3002`  | microservices    |
| `MACHINE_LEARNING_PORT` | Machine Learning Port | `3003`  | machine learning |

## URLs

| Variable                      | Description                                              |                Default                | Services              |
| :---------------------------- | :------------------------------------------------------- | :-----------------------------------: | :-------------------- |
| `IMMICH_WEB_URL`              | Immich Web URL                                           |       `http://immich-web:3000`        | proxy                 |
| `IMMICH_SERVER_URL`           | Immich Server URL                                        |       `http://immich-web:3000`        | web, proxy            |
| `IMMICH_MACHINE_LEARNING_URL` | Immich Machine Learning URL, set `"false"` to disable ML | `http://immich-machine-learning:3003` | server, microservices |
| `PUBLIC_IMMICH_SERVER_URL`    | Public Immich URL                                        |      `http://immich-server:3001`      | web                   |
| `IMMICH_API_URL_EXTERNAL`     | Immich API URL External                                  |                `/api`                 | web                   |

## Paths

| Variable                           | Description                      |           Default            | Services              |
| :--------------------------------- | :------------------------------- | :--------------------------: | :-------------------- |
| `IMMICH_MEDIA_LOCATION`            | Media Location                   |          `./upload`          | server, microservices |
| `MACHINE_LEARNING_CACHE_FOLDER`    | ML Cache Location                |           `/cache`           | machine learning      |
| `REVERSE_GEOCODING_DUMP_DIRECTORY` | Reverse Geocoding Dump Directory | `./.reverse-geocoding-dump/` | microservices         |

## Database

| Variable      | Description       |   Default   | Services              |
| :------------ | :---------------- | :---------: | :-------------------- |
| `DB_URL`      | Database URL      |     ``      | server, microservices |
| `DB_HOSTNAME` | Database Host     | `localhost` | server, microservices |
| `DB_PORT`     | Database Port     |   `5432`    | server, microservices |
| `DB_USERNAME` | Database User     | `postgres`  | server, microservices |
| `DB_PASSWORD` | Database Password | `postgres`  | server, microservices |
| `DB_DATABASE` | Database Name     |  `immich`   | server, microservices |

> When `DB_URL` is defined, the other database (`DB_*`) variables are ignored.

## Redis

| Variable         | Description    |    Default     | Services              |
| :--------------- | :------------- | :------------: | :-------------------- |
| `REDIS_URL`      | Redis URL      |       ``       | server, microservices |
| `REDIS_HOST`     | Redis Host     | `immich_redis` | server, microservices |
| `REDIS_PORT`     | Redis Port     |     `6379`     | server, microservices |
| `REDIS_INDEX`    | Redis Index    |      `0`       | server, microservices |
| `REDIS_USERNAME` | Redis Username |       ``       | server, microservices |
| `REDIS_PASSWORD` | Redis Password |       ``       | server, microservices |
| `REDIS_SOCKET`   | Redis Socket   |       ``       | server, microservices |

> `REDIS_URL` must start with `ioredis://`.
> When `REDIS_URL` is defined, the other redis (`REDIS_*`) variables are ignored.

## Typesense

| Variable             | Description        |   Default   | Services              |
| :------------------- | :----------------- | :---------: | :-------------------- |
| `TYPESENSE_ENABLED`  | Enable Typesense   |   `false`   | server, microservices |
| `TYPESENSE_URL`      | Typesense URL      |     ``      | server, microservices |
| `TYPESENSE_API_KEY`  | Typesense API Key  |     ``      | server, microservices |
| `TYPESENSE_HOST`     | Typesense Host     | `typesense` | server, microservices |
| `TYPESENSE_PORT`     | Typesense Port     |   `8108`    | server, microservices |
| `TYPESENSE_PROTOCOL` | Typesense Protocol |   `http`    | server, microservices |

> `TYPESENSE_URL` must start with `ha://`
> When `TYPESENSE_URL` is defined, the other typesense (`TYPESENSE_*`) variables are ignored.

## Machine Learning

| Variable                                    | Description              |        Default        | Services         |
| :------------------------------------------ | :----------------------- | :-------------------: | :--------------- |
| `MACHINE_LEARNING_MIN_FACE_SCORE`           | Minimum Face Score       |         `0.7`         | machine learning |
| `MACHINE_LEARNING_MODEL_TTL`                | Model TTL                |         `300`         | machine learning |
| `MACHINE_LEARNING_EAGER_STARTUP`            | Eager Startup            |        `true`         | machine learning |
| `MACHINE_LEARNING_MIN_TAG_SCORE`            | Minimum Tag Score        |         `0.9`         | machine learning |
| `MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL` | Facial Recognition Model |      `buffalo_l`      | machine learning |
| `MACHINE_LEARNING_CLIP_TEXT_MODEL`          | Clip Text Model          |    `clip-ViT-B-32`    | machine learning |
| `MACHINE_LEARNING_CLIP_IMAGE_MODEL`         | Clip Image Model         |    `clip-ViT-B-32`    | machine learning |
| `MACHINE_LEARNING_CLASSIFICATION_MODEL`     | Classification Model     | `microsoft/resnet-50` | machine learning |
