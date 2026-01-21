# Automatic Backup

## Overview

Immich supports uploading photos and videos from your mobile device to the server automatically.

By enable the backup button, Immich will upload new photos and videos from selected albums when you open or resume the app, as well as periodically in the background (iOS), or when the a new photos or videos are taken (Android).

<img
src={require('./img/enable-backup-button.webp').default}
width="300px"
title="Upload button"
/>

## Platform Specific Features

### General

By default, Immich will only upload photos and videos when connected to Wi-Fi. You can change this behavior in the backup settings page.

<img
src={require('./img/backup-options.webp').default}
width="500px"
title="Upload button"
/>

### Android

<img
src={require('./img/android-backup-options.webp').default}
width="500px"
title="Upload button"
/>

- It is a well-known problem that some Android models are very strict with battery optimization settings, which can cause a problem with the background worker. Please visit [Don't kill my app](https://dontkillmyapp.com/) for a guide on disabling this setting on your phone.
- You can allow the background task to run when the device is charging.
- You can set the minimum delay from the time a photo is taken to when the background upload task will run.

### iOS

- You must enable **Background App Refresh** for the app to work in the background. You can enable it in the Settings app under General > Background App Refresh.

<div style={{textAlign: 'center'}}>
<img src={require('./img/background-app-refresh.webp').default} width="30%" title="background-app-refresh" />
</div>

- iOS automatically manages background tasks, the app cannot control when the background upload task will run. It is known that the more frequently you open the app, the more often the background task will run.
