# External Libraries [Beta]

## Overview

Immich supports synchronization of existing photos and videos. Files are kept on disk and any changes are imported upon rescan.

:::

## Usage

:::tip Example scenario

There are two folders that contain photos and one folder containing videos:

- Photos taken on my latest trip with a DSLR using raw+jpg stored at `/mnt/media/christmas-trip` with the folder `/mnt/media/christmas-trip/raw` containing raw files. We don't want to import the raw files to immich
- A folder contining photos from my childhood at `/mnt/media/old-pics`
- Videos on `/mnt/media/videos`

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
+     - /mnt/media/christmas-trip:/mnt/media/christmas-trip:ro
+     - /mnt/media/old-pics:/mnt/media/old-pics:ro
+     - /mnt/media/videos:/mnt/media/videos:ro
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
+     - /mnt/media/christmas-trip:/mnt/media/christmas-trip:ro
+     - /mnt/media/old-pics:/mnt/media/old-pics:ro
+     - /mnt/media/videos:/mnt/media/videos:ro
    env_file:
      - .env
    depends_on:
      - redis
      - database
      - typesense
    restart: always
```

:::tip
Internal and external path do not have to be identical but can make things easier to configure in the GUI.
:::

_Remember to bring the container down/up to register the changes. Make sure you can see the mounted path in the container._

### Register the path for the user.

This action is done by the admin of the instance.

- Navigate to `Administration > Users` page on the web.
- Click on the user edit button.
- Add the gallery path to the `External Path` field for the corresponding user and confirm the changes.

<img src={require('./img/me.png').default} width='33%' title='My Account Storage Path' />

<img src={require('./img/my-wife.png').default} width='33%' title='My Wifes Account Storage Path' />

### Create external library


- Click on your user name in the top right corner -> Account Settings
- Click on Libraries
- Click on Create Library, then Create External Library
- Click the drop-down menu on the newly created library
- Click Edit Import Paths
- Click on Add Path
- Enter "/mnt/media/christmas-trip" then click Add

NOTE: this path must be inside the user's external path

- Click on Add Path
- Enter "/mnt/media/old-pics" then click Add

NOTE: this path must be inside the user's external path

- Click Save

Now we'll add the exclusion pattern to ignore the raw files folder

- Click the drop-down menu on the newly created library
- Click on Manage
- Click on Scan Settings
- Click on Add Exclusion Pattern
- Enter \*\*/Raw/\*\* and click save.
- Click save
- Click the drop-down menu on the newly created library
- Click on Scan Library Files

Now the scan will start in the background and in seconds the first assets should display on the main timeline. The files in the raw photos are ignored.

Next, do the same steps again for the video file. You can add that to the existing library but it is also possible to create a separate library for that.

In the future there will be more library-specific configuration options or sharing features so plan your libraries accordingly.

### Refreshing

Whenever the files are changed, go to the library and do Scan Library Files.
