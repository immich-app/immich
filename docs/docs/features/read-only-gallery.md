# Read-only Gallery [Experimental]

## Overview

This feature enables users to use an existing gallery without uploading the assets to Immich.

Upon syncing the file information, it will be read by Immich to generate supported files.

:::caution

This feature is still in an experimental stage. And this is an initial implementation and will receive improvements in the future.

The current limitations of this feature are:

- Assets are not automatically synced and must instead be manually synced with the CLI tool.
- Only new files that are added to the gallery will be detected.
- Deleted and moved files will not be detected.

:::

## Usage

:::tip Example scenario

On the VM/system that Immich is running, I have 2 galleries that I want to use with Immich.

- My gallery is stored at `/mnt/media/precious-memory`
- My wife's gallery is stored at `/mnt/media/childhood-memory`

We will use those values in the steps below.

:::

### Mount the gallery to the containers.

`immich-server` and `immich-microservices` containers will need access to the gallery. Mount the directory path as in the example below

```diff title="docker-compose.yml"
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
    command: [ "start.sh", "immich" ]
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - /mnt/media/precious-memory:/mnt/media/precious-memory:ro
+     - /mnt/media/childhood-memory:/mnt/media/childhood-memory:ro
    env_file:
      - .env
    depends_on:
      - redis
      - database
      - typesense
    restart: always

  immich-microservices:
    container_name: immich_microservices
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
    command: [ "start.sh", "microservices" ]
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - /mnt/media/precious-memory:/mnt/media/precious-memory:ro
+     - /mnt/media/childhood-memory:/mnt/media/childhood-memory:ro
    env_file:
      - .env
    depends_on:
      - redis
      - database
      - typesense
    restart: always
```

:::tip
Internal and external path have to be identical.
:::

_Remember to bring the container down/up to register the changes. Make sure you can see the mounted path in the container._

### Register the path for the user.

This action is done by the admin of the instance.

- Navigate to `Administration > Users` page on the web.
- Click on the user edit button.
- Add the gallery path to the `External Path` field for the corresponding user and confirm the changes.

<img src={require('./img/me.png').default} width='33%' title='My Account Storage Path' />

<img src={require('./img/my-wife.png').default} width='33%' title='My Wifes Account Storage Path' />

### Sync with the CLI tool.

- Install or update the [CLI Tool](/docs/features/bulk-upload.md). The import feature is supported from version `v0.39.0` of the CLI
- Run the command below to sync the gallery with Immich.

```bash title="Import my gallery"
immich upload --key <my-api-key> --server http://my-server-ip:2283/api /mnt/media/precious-memory --recursive --import
```

```bash title="Import my wife gallery"
immich upload --key <my-wife-api-key> --server http://my-server-ip:2283/api /mnt/media/childhood-memory --recursive --import
```

The `--import` flag will tell Immich to import the files by path instead of uploading them.
