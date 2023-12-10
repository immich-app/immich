This guide walks you through adding an [External Library](../features/libraries#external-libraries).
This guide assumes you are running Immich in Docker and that the files you wish to access are stored
in a directory on the same machine.

# Mount the directory into the containers.

Edit `docker-compose.yml` to add two new mount points under `volumes:`

```
  immich-server:
    volumes:
      - ${EXTERNAL_PATH}:/usr/src/app/external
```

Be sure to add exactly the same line to both `immich-server:` and `immich-microservices:`.

[Question for the devs: Is editing docker-compose.yml really the desirable way to solve this problem?
I assumed user changes were supposed to be kept to .env?]

Edit `.env` to define `EXTERNAL_PATH`, substituting in the correct path for your computer:

```
EXTERNAL_PATH=<your-path-here>
```

On my computer, for example, I use this path:

```
EXTERNAL_PATH=/home/tenino/photos
```

Restart Immich.

```
docker compose down
docker compose up -d
```

# Set the External Path

In the Immich web UI:

- click the **Administration** link in the upper right corner.
- Select the **Users** tab
- Select the **pencil** next to your user ID
- Fill in the **External Path** field with `/usr/src/app/external`

Notice this matches the path _inside the container_ where we mounted your photos.
The purpose of the external path field is for administrators who have multiple users
on their Immich instance. It lets you prevent other authorized users from
navigating to your external library.

# Import the library

In the Immich web UI:

- Click your user avatar in the upper-right corner (circle with your initials)
- Click **Account Settings**
- Click to expand **Libraries**
- Click the **Create External Library** button
- Click the three-dots menu and select **Edit Import Paths**
- Click \*_Add path_
- Enter **.** as the path
- Click the three-dots menu and select **Re-scan All Library Files** [I'm not sure whether this is necessary]

# Confirm stuff is happening

- Click **Administration**
- Select the **Jobs** tab
- You should see non-zero Active jobs for
  Library, Generate Thumbnails, and Extract Metadata.
