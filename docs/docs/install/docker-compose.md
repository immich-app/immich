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

or by downloading from your browser and moving the files to the directory that you created.

Note: If you downloaded the files from your browser, also ensure that you rename `example.env` to `.env`.

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

####################################################################################
# Alternative Service Addresses - Optional
#
# This is an advanced feature for users who may be running their immich services on different hosts.
# It will not change which address or port that services bind to within their containers, but it will change where other services look for their peers.
# Note: immich-microservices is bound to 3002, but no references are made
####################################################################################

IMMICH_WEB_URL=http://immich-web:3000
IMMICH_SERVER_URL=http://immich-server:3001
IMMICH_MACHINE_LEARNING_URL=http://immich-machine-learning:3003

####################################################################################
# Alternative API's External Address - Optional
#
# This is an advanced feature used to control the public server endpoint returned to clients during Well-known discovery.
# You should only use this if you want mobile apps to access the immich API over a custom URL. Do not include trailing slash.
# NOTE: At this time, the web app will not be affected by this setting and will continue to use the relative path: /api
# Examples: http://localhost:3001, http://immich-api.example.com, etc
####################################################################################

#IMMICH_API_URL_EXTERNAL=http://localhost:3001

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
docker-compose up -d     # or `docker compose up -d` based on your docker-compose version
```

:::tip
For more information on how to use the application, please refer to the [Post Installation](/docs/install/post-install.mdx) guide.
:::

### Step 4 - Upgrading

If `IMMICH_VERSION` is set, it will need to be updated to the latest or desired version.

When a new version of Immich is [released](https://github.com/immich-app/immich/releases), the application can be upgraded with the following commands, run in the directory with the `docker-compose.yml` file:

```bash title="Upgrade Immich"
docker-compose pull && docker-compose up -d     # Or `docker compose up -d`
```

:::caution Automatic Updates
Immich is currently under heavy development, which means you can expect breaking changes and bugs. Therefore, we recommend reading the release notes prior to updating and to take special care when using automated tools like [Watchtower][watchtower].
:::

[compose-file]: https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
[env-file]: https://github.com/immich-app/immich/releases/latest/download/example.env
[watchtower]: https://containrrr.dev/watchtower/
