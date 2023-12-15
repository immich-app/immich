# External Library

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
  <img src={require('./img/administration-link.png').default} width="50%" title="Administration link" />

- Select the **Users** tab
  <img src={require('./img/users-tab.png').default} width="50%" title="Users tab" />

- Select the **pencil** next to your user ID
  <img src={require('./img/pencil.png').default} width="50%" title="Pencil" />

- Fill in the **External Path** field with `/usr/src/app/external`
  <img src={require('./img/external-path.png').default} width="50%" title="External Path field" />

Notice this matches the path _inside the container_ where we mounted your photos.
The purpose of the external path field is for administrators who have multiple users
on their Immich instance. It lets you prevent other authorized users from
navigating to your external library.

# Import the library

In the Immich web UI:

- Click your user avatar in the upper-right corner (circle with your initials)
  <img src={require('./img/user-avatar.png').default} width="50%" title="User avatar" />

- Click **Account Settings**
  <img src={require('./img/account-settings.png').default} width="50%" title="Account Settings button" />

- Click to expand **Libraries**
  <img src={require('./img/libraries-dropdown.png').default} width="50%" title="Libraries dropdown" />

- Click the **Create External Library** button
  <img src={require('./img/create-external-library-button.png').default} width="50%" title="Create External Library button" />

- Click the three-dots menu and select **Edit Import Paths**
  <img src={require('./img/edit-import-paths.png').default} width="50%" title="Edit Import Paths menu option" />

- Click \*_Add path_
  <img src={require('./img/add-path-button.png').default} width="50%" title="Add Path button" />

- Enter **.** as the path and click Add
  <img src={require('./img/add-path-field.png').default} width="50%" title="Add Path field" />

- Save the new path
  <img src={require('./img/path-save.png').default} width="50%" title="Path Save button" />

- Click the three-dots menu and select **Scan New Library Files** [I'm not sure whether this is necessary]
  <img src={require('./img/scan-new-library-files.png').default} width="50%" title="Scan New Library Files menu option" />

# Confirm stuff is happening

- Click **Administration**
  <img src={require('./img/administration-link.png').default} width="50%" title="Administration link" />

- Select the **Jobs** tab
  <img src={require('./img/jobs-tab.png').default} width="50%" title="Jobs tab" />

- You should see non-zero Active jobs for
  Library, Generate Thumbnails, and Extract Metadata.
  <img src={require('./img/job-status.png').default} width="50%" title="Job Status display" />
