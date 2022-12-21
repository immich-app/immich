---
sidebar_position: 1
---

# Post Installation

This page contains information about what to do after you have installed the application.

## Step 1 - Download the mobile app

The mobile app can be downloaded from

- [Google Play Store](https://play.google.com/store/apps/details?id=app.alextran.immich)
- [Apple App Store](https://apps.apple.com/us/app/immich/id1613945652)
- [F-Droid](https://f-droid.org/packages/app.alextran.immich)

## Step 2 - Register the admin user

The first user to register will be the admin user. The admin user will be able to add other users to the application.

To register for the admin user, access the web application at `http://<machine-ip-address>:2283` and click on the **Getting Started** button.

<img src={require('./img/admin-registration-form.png').default} width="500" title="Admin Registration" />

Follow the prompts to register as the admin user and log in to the application.

## Step 3 - Create a new user (optional)

If you have a family member who wants to use the application, you can create a new account. The default password is `password`, and the user can change their password after logging in to the application for the first time.

<img src={require('./img/create-new-user.png').default} title="Admin Registration" />


## Step 4 - Set storage template (optional)

Immich allows the admin user to set the pattern of how the files are uploaded to the Immich would look like. Both in the directory and the filename level.

The admin user can set the template by using the template builder in the `Administration -> Settings -> Storage Template`. Immich provides a set of variables that you can use in construting the template, along with additional custom text. 

```bash title="Default template"
Year/Year-Month-Day/Filename.Extension
```

<img src={require('./img/storage-template.png').default} width="100%" title="Storage Template Setting" />

Immich also provides a mechanism to migrate between template so that if the template you set now doesn't work in the future, you can always migrate all the existing files to the new template. The mechanism is run as a job in the Job page.

## Step 5 - Access the mobile app

Login to the mobile app with the server endpoint URL at `http://<machine-ip-address>:2283/api`

<img src={require('./img/sign-in-phone.jpeg').default} width="50%" title="Mobile App Sign In" />

## Step 6 - Back up your photos and videos

Navigate to the backup screen by clicking on the cloud icon in the top right corner of the screen.

<img src={require('./img/backup-header.png').default} width="50%" title="Backup button" />

You can select which album(s) you want to back up to the Immich server from the backup screen.

<img src={require('./img/album-selection.png').default} width="50%" title="Backup button" />

Scroll down to the bottom and press "**Start Backup**" to start the backup process. 

You can also enable auto foreground or background backup (only on Android). For more information about the app mechanism, please visit the next pages.


:::tip Application Mechanism
#### [Foreground and background backup](/docs/usage/automatic-backup)
#### [Bulk upload (using the CLI)](/docs/usage/bulk-upload)
:::
