# Automatic Backup

Immich supports uploading photos and videos from your mobile device to the server automatically.

---

You can enable the settings by accessing the upload options from the upload page

<img src={require('./img/backup-settings-access.webp').default} width="50%" title="Backup option selection" />

<img src={require('./img/background-foreground-backup.webp').default} width="50%" title="Foreground&Background Backup" />

## Foreground backup

If foreground backup is enabled: whenever the app is opened or resumed, it will check if any photos or videos in the selected album(s) have yet to be uploaded to the cloud (the remainder count). If there are any, they will be uploaded.

## Background backup

This feature is intended for everyday use. For initial bulk uploading, please use the foreground upload feature. For more information on why background upload is not working as expected, please refer to the [FAQ](/docs/FAQ#why-does-foreground-backup-stop-when-i-navigate-away-from-the-app-shouldnt-it-transfer-the-job-to-background-backup).

If background backup is enabled. The app will periodically check if there are any new photos or videos in the selected album(s) to be uploaded to the server. If there are, it will upload them to the cloud in the background.

:::info Note

#### General

- The app must be in the background for the backup worker to start running.
- If you reopen the app and the first page you see is the backup page, the counts will not reflect the background uploaded result. You have to navigate out of the page and come back to see the updated counts.

#### Android

- It is a well-known problem that some Android models are very strict with battery optimization settings, which can cause a problem with the background worker. Please visit [Don't kill my app](https://dontkillmyapp.com/) for a guide on disabling this setting on your phone.

#### iOS

- You must enable **Background App Refresh** for the app to work in the background. You can enable it in the Settings app under General > Background App Refresh.

<div style={{textAlign: 'center'}}>
<img src={require('./img/background-app-refresh.webp').default} width="30%" title="background-app-refresh" />
</div>

:::
