---
sidebar_position: 2
---


# Automatic Backup

A guide on how the foreground and background automatic backup works.

<img src={require('./img/background-foreground-backup.png').default} width="50%" title="Foreground&Background Backup" />

On iOS, there is only one option for automatic backup 
  * [**Foreground backup**](#foreground-backup)

On Android, there are two options for automatic backup 
  * [**Foreground backup**](#foreground-backup) 
  * [**Background backup**](#background-backup)

## Foreground backup

If foreground backup is enabled: whenever the app is opened or resumed, it will check if any photos or videos in the selected album(s) have yet to be uploaded to the cloud (the remainder count). If there are any, they will be uploaded.

## Background backup

Background backup is only available on Android thanks to the contribution effort of [@zoodyy](https://github.com/zoodyy). 

If background backup is enabled. The app will periodically check if there are any new photos or videos in the selected album(s) to be uploaded to the cloud. If there are, it will upload them to the cloud in the background.

A native Android notification shows up when the background upload is in progress. You can further customize the notification by going to the app's settings.

:::note 
* The app must be in the background for the backup worker to start running.
* It is a well-known problem that some Android models are very strict with battery optimization settings, which can cause a problem with the background worker. Please visit [Don't kill my app](https://dontkillmyapp.com/) for a guide on disabling this setting on your phone. 
* If you reopen the app and the first page you see is the backup page, the counts will not reflect the background uploaded result. You have to navigate out of the page and come back to see the updated counts.
:::
