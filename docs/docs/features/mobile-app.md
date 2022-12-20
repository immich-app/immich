---
sidebar_position: 1
---

# Mobile App

:::info Beta Program
The beta release channel allows users to test upcoming changes before they are officially released. To join the channel use the links below.

- Android: Invitation link from [web](https://play.google.com/store/apps/details?id=app.alextran.immich) or from [mobile](https://play.google.com/store/apps/details?id=app.alextran.immich)
- iOS: [TestFlight invitation link](https://testflight.apple.com/join/1vYsAa8P)

:::

## Download

The mobile app can be downloaded from the following places:

- [Google Play Store](https://play.google.com/store/apps/details?id=app.alextran.immich)
- [Apple App Store](https://apps.apple.com/us/app/immich/id1613945652)
- [F-Droid](https://f-droid.org/packages/app.alextran.immich)
- [Github Releases (apk)](https://github.com/immich-app/immich/releases)

## Login

Login to the mobile app with the server endpoint URL at `http://<machine-ip-address>:2283/api`

<img src={require('./img/sign-in-phone.jpeg').default} width="50%" title="Mobile App Sign In" />

## Backup

Navigate to the backup screen by clicking on the cloud icon in the top right corner of the screen.

<img src={require('./img/backup-header.png').default} width="50%" title="Backup button" />

You can select which album(s) you want to back up to the Immich server from the backup screen.

<img src={require('./img/album-selection.png').default} width="50%" title="Backup button" />

Scroll down to the bottom and press "**Start Backup**" to start the backup process.

:::info
You can enable automatic backup on supported devices. For more information see [Automatic Backup](/docs/docs/features/automatic-backup.md).
:::

:::info
To upload from other devices, try using the [Bulk Upload CLI](<(docs/feature/bulk-upload.mdk)>).
:::
