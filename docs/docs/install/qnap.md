---
sidebar_position: 87
---

# Qnap [Community]

::: note
This is a community contribution and not officially supported by the Immich team, but included here for convenience.

Community support should be directed to Qnap-specific support platforms.
:::

Immich can easily be installed on a Qnap NAS using [Container Station](https://www.qnap.com/en/how-to/tutorial/article/container-station-quick-start-guide) within QTS. Container Station comes already installed on QTS, check [Container Station docs](https://www.qnap.com/en/how-to/tutorial/article/how-to-use-container-station-3) for detailed information on using Container Station.

## Step 1 - Qnap configuration checklist for running Immich

- The default admin user must be enabled to run containers.
  - To enable, open Control Panel, Privilege, Users to verify admin status is Enabled.
  - If not, login with another administrator user and uncheck the Disable this account checkbox in the Edit Account Profile window.

### Optional - Store Immich Data Outside Containers Folder

- To store Immich data outside the default Containers folder, providing easier direct access to the files or sharing by other services.
- Enable Advanced Folder Permissions.
  - Open Control Panel, Privilege, Shared Folders, Advanced Permissions tab, check Enable Advanced Folder Permissions and click Apply button.
- Recomended: Setup Immich data folder in Multimedia Shared Folder
  - In Control Panel, Privilege, Shared Folders, click Multimedia Edit Shared Folder Permissions button
  - Add admin user with read/write (RW) access to the folder
  - Click Apply changes to files and subfolders checkbox
  - Click Apply button
  - Open File Station, Multimedia folder, and add Immich folder

### Optional - Access existing photo files with External Libraries

- To allow Immich to access existing folders with photos on the Qnap storage, they must be accessable to the admin user and added as volume bindings in the docker compose.
- Enable Advanced Folder Permissions.
  - Open Control Panel, Privilege, Shared Folders, Advanced Permissions tab, check Enable Advanced Folder Permissions and click Apply button.
- Add admin account permissions for existing folders.
  - In Privilege > Shared Folders, click Edit Shared Folder Permissions button on folder row.
  - Use Shares folder tree to select existing folders with photo files.
  - Add admin user with read/write (RW) access to the folder
  - click Apply changes to files and subfolders checkbox
  - click Apply button

## Step 2 - Start Container Station

In the Qnap application menu open Container Station. Complete the Welcome screen where a new Shared Folder called Container is created by default.

If the welcome screen keeps appearing when opening Container Station restart the NAS. If it keeps happening, try to uninstall and reinstall Container Station.

## Step 3 - Download docker compose files

Download [`docker-compose.yml`](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml) and [`example.env`](https://github.com/immich-app/immich/releases/latest/download/example.env) to your computer.

## Step 4 - Populate the docker compose file with .env and custom values

Qnap Container Station's Application wizard cannot process env_file statements in a docker compose file. Values from the .env file must be moved into the compose file.

Open the docker-compose and .env files in text editors on your computer.

- In docker-compose.yml:
- Replace the ${IMMICH_VERSION:-release} with the .env values (v3).
- Replace the other ${ENV_VALUE} instances with values from the .env file
- Remove the env_file: sections from each service yml
- Recommended: Keep default value for postgres password or the immich_server container will error during startup.
- Recommended: Uncomment the DB_STORAGE_TYPE: 'HDD' line in the database: section if your NAS uses hard-drives, not SSDs.

- ### Optional: Store Immich Data Outside Containers Folder
  - In general, it's best practice to have Container Station applications store files under the `./Container` directory. Folders will automatically be created by Container Station.
  - Storing Immich-server data outside the Container folder allows easier navigation and sharing of files uploaded to Immich because the `./Container` directory has restrictive permission.
  - In services, immich-server yml, set volumes binding values for immich-server to access folder.
  - Comment out existing line:
    ```
      #- ${UPLOAD_LOCATION}:/data
    ```
  - Set external source for Immich default /data folder.
    ```
    - type: bind
      source: /share/Multimedia/Immich
      target: /data
    ```
- ### Optional: Access existing photo files with External Libraries
  - In services, immich-server yml, add volumes binding for existing folders and set unique target values.
    ```
    - type: bind
      source: /share/Multimedia/Photos
      target: /multimediaphotos
    ```
    ```
    - type: bind
      source: "/share/homes/[username]/Pictures Folder"
      target: /userpictures
    ```

## Step 6 - Upload docker compose to Containers folder

With Qnap File Station, open the Containers folder and create a folder for storing docker compose files.

Upload your edited compose file to the folder.

## Step 7 - Create Application in Container Station

Open Container Station, and select the "**Applications**" action on the left navigation bar and then click "**+ Create**".

In the Create Application screen, set "**Application name**" to a name such as _immich-app_.

Use the Upload > Local QNAP Device buttons to open the docker compose file in ./Containers/compose.

Click the Validate button to check for any syntax errors. A green checkmark should appear. Warnings will popup if any issues are found and you will not be able to create the application.

Modifying Advanced Settings is not required, but can be used to limit the Resources. Keep Default Web URL Port disabled, the docker yml file sets the outside port and Container Station crates the required networking rules for accessing Immich.

Click the Create button.

Once your containers are successfully running, navigate to the "**Containers**" section of Container Station, click on the "**immich-server**" container. In the Container Details section is the Port Forwarding value, click the copy button and paste the url into a new browser tab to open the Immich Web app.

If the website doesn't open in a web browser, open the immich_server page and open the Logs tab. Any application errors will be output into the terminal.

## Step 8 - Optional: Access existing photo files with External Libraries

After completing the setup wizard. Open the Administration page from the top right menu.

Click the External Libraries section and click Create Library.

Click the Folders add button.

Enter in the `target` value from the `volumes` binding in the docker compose `immich-server` section.

From the examples above '/multimediaphotos' and '/userpictures' are valid to enter in the Path textbox.

Click Add button.

## Updating Immich

To update Immich it is recommended to use the Container Station, Applications, Recreate process.

This brings up the docker compose text in the Recreate Application window.
Edit the docker compose text to update versions or just click Update button.

The latest version of the image major version will be downloaded.

The postgres database will be cleared by this operation, the Immich data and backups will be preserved and used to restore the app.

When the Immich website comes back online, it displays options for Getting Started and Restore From Backup. Click Restore From Backup.

Manually refresh the browser if it doesn't automatically refresh the page.

Click Next on the Restore Your Library page. Select the most recent backup and click Restore button.
