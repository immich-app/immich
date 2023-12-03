---
sidebar_position: 30
---

# Docker Compose [Recommended]

Docker Compose is the recommended method to run Immich in production. Below are the steps to deploy Immich with Docker Compose.

### Step 1 - Download the required files

Create a directory of your choice (e.g. `./immich-app`) to hold the `docker-compose.yml` and `.env` files.

```bash title="Move to the directory you created"
mkdir ./immich-app
cd ./immich-app
```

Download [`docker-compose.yml`][compose-file] and [`example.env`][env-file], either by running the following commands:

```bash title="Get docker-compose.yml file"
wget https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
```

```bash title="Get .env file"
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
```

```bash title="(Optional) Get hwaccel.yml file"
wget https://github.com/immich-app/immich/releases/latest/download/hwaccel.yml
```

or by downloading from your browser and moving the files to the directory that you created.

Note: If you downloaded the files from your browser, also ensure that you rename `example.env` to `.env`.

:::info
Optionally, you can use the [`hwaccel.yml`][hw-file] file to enable hardware acceleration for transcoding. See the [Hardware Transcoding](/docs/features/hardware-transcoding.md) guide for info on how to set this up.
:::

### Step 2 - Populate the .env file with custom values

<details>

<summary>Example <code>.env</code> content</summary>

```bash
###################################################################################
# Database
###################################################################################

DB_HOSTNAME=immich_postgres
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE_NAME=immich

# Optional Database settings:
# DB_PORT=5432

###################################################################################
# Redis
###################################################################################

REDIS_HOSTNAME=immich_redis

# Optional Redis settings:

# Note: these parameters are not automatically passed to the Redis Container
# to do so, please edit the docker-compose.yml file as well. Redis is not configured
# via environment variables, only redis.conf or the command line

# REDIS_PORT=6379
# REDIS_DBINDEX=0
# REDIS_PASSWORD=
# REDIS_SOCKET=

###################################################################################
# Upload File Location
#
# This is the location where uploaded files are stored.
###################################################################################

UPLOAD_LOCATION=absolute_location_on_your_machine_where_you_want_to_store_the_backup


###################################################################################
# Log message level - [simple|verbose]
###################################################################################

LOG_LEVEL=simple

###################################################################################
# Typesense
###################################################################################
# TYPESENSE_ENABLED=false
TYPESENSE_API_KEY=some-random-text
# TYPESENSE_HOST: typesense
# TYPESENSE_PORT: 8108
# TYPESENSE_PROTOCOL: http

###################################################################################
# Reverse Geocoding
#
# Reverse geocoding is done locally which has a small impact on memory usage
# This memory usage can be altered by changing the REVERSE_GEOCODING_PRECISION variable
# This ranges from 0-3 with 3 being the most precise
# 3 - Cities > 500 population: ~200MB RAM
# 2 - Cities > 1000 population: ~150MB RAM
# 1 - Cities > 5000 population: ~80MB RAM
# 0 - Cities > 15000 population: ~40MB RAM
####################################################################################

# DISABLE_REVERSE_GEOCODING=false
# REVERSE_GEOCODING_PRECISION=3

####################################################################################
# WEB - Optional
#
# Custom message on the login page, should be written in HTML form.
# For example:
# PUBLIC_LOGIN_PAGE_MESSAGE="This is a demo instance of Immich.<br><br>Email: <i>demo@demo.de</i><br>Password: <i>demo</i>"
####################################################################################

PUBLIC_LOGIN_PAGE_MESSAGE="My Family Photos and Videos Backup Server"

###################################################################################
# Immich Version - Optional
#
# This allows all immich docker images to be pinned to a specific version. By default,
# the version is "release" but could be a specific version, like "v1.59.0".
###################################################################################

#IMMICH_VERSION=
```

</details>

- Populate custom database information if necessary.
- Populate `UPLOAD_LOCATION` with your preferred location for storing backup assets.
- Consider changing `DB_PASSWORD` to something randomly generated
- Consider changing `TYPESENSE_API_KEY` to something randomly generated

### Step 3 - Start the containers

From the directory you created in Step 1, (which should now contain your customized `docker-compose.yml` and `.env` files) run `docker-compose up -d`.

```bash title="Start the containers using docker compose command"
docker compose up -d
```

:::tip
For more information on how to use the application, please refer to the [Post Installation](/docs/install/post-install.mdx) guide.
:::

:::tip
Note that downloading container images might require you to authenticate to the GitHub Container Registry ([steps here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry)).
:::

### Step 4 - Upgrading

If `IMMICH_VERSION` is set, it will need to be updated to the latest or desired version.

When a new version of Immich is [released](https://github.com/immich-app/immich/releases), the application can be upgraded with the following commands, run in the directory with the `docker-compose.yml` file:

```bash title="Upgrade Immich"
docker compose pull && docker compose up -d
```

:::caution Automatic Updates
Immich is currently under heavy development, which means you can expect breaking changes and bugs. Therefore, we recommend reading the release notes prior to updating and to take special care when using automated tools like [Watchtower][watchtower].
:::

[compose-file]: https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
[env-file]: https://github.com/immich-app/immich/releases/latest/download/example.env
[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.yml
[watchtower]: https://containrrr.dev/watchtower/
