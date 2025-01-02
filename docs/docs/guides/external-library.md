# External Library

This guide walks you through adding an [External Library](/docs/features/libraries).
This guide assumes you are running Immich in Docker and that the files you wish to access are stored
in a directory on the same machine.

# Mount the directory into the containers.

Edit `docker-compose.yml` to add one or more new mount points in the section `immich-server:` under `volumes:`.
If you want Immich to be able to delete the images in the external library or add metadata ([XMP sidecars](/docs/features/xmp-sidecars)), remove `:ro` from the end of the mount point.

```diff
immich-server:
    volumes:
        - ${UPLOAD_LOCATION}:/usr/src/app/upload
+       - /home/user/photos1:/home/user/photos1:ro
+       - /mnt/photos2:/mnt/photos2:ro # you can delete this line if you only have one mount point, or you can add more lines if you have more than two
```

Restart Immich by running `docker compose up -d`.

# Create the library

In the Immich web UI:

- click the **Administration** link in the upper right corner.
  <img src={require('./img/administration-link.webp').default} width="50%" title="Administration link" />

- Select the **External Libraries** tab
  <img src={require('./img/external-libraries.webp').default} width="50%" title="External Libraries tab" />

- Click the **Create Library** button
  <img src={require('./img/create-external-library.webp').default} width="50%" title="Create Library button" />

- In the dialog, select which user should own the new library
  <img src={require('./img/library-owner.webp').default} width="50%" title="Library owner diaglog" />

- Click the three-dots menu and select **Edit Import Paths**
  <img src={require('./img/edit-import-paths.webp').default} width="50%" title="Edit Import Paths menu option" />

- Click Add path
  <img src={require('./img/add-path-button.webp').default} width="50%" title="Add Path button" />

- Enter **/usr/src/app/external** as the path and click Add
  <img src={require('./img/add-path-field.webp').default} width="50%" title="Add Path field" />

- Save the new path
  <img src={require('./img/path-save.webp').default} width="50%" title="Path Save button" />

- Click the three-dots menu and select **Scan New Library Files**
  <img src={require('./img/scan-new-library-files.webp').default} width="50%" title="Scan New Library Files menu option" />

# Confirm stuff is happening

- Click **Administration**
  <img src={require('./img/administration-link.webp').default} width="50%" title="Administration link" />

- Select the **Jobs** tab
  <img src={require('./img/jobs-tab.webp').default} width="50%" title="Jobs tab" />

- You should see non-zero Active jobs for
  Library, Generate Thumbnails, and Extract Metadata.
  <img src={require('./img/job-status.webp').default} width="50%" title="Job Status display" />
