---
title: Casting architecture
sidebar_position: 4
---

# Casting architecture

Immich's web and mobile apps support casting photos and videos to a Chromecast device. Such Cast devices run a "receiver" app that fetches photos and videos directly from the Immich server. The user controls the Cast device through the sender app and navigates between photos and videos which is then reflected on the screen.

## Components and data flow

1. The user clicks the Cast button on the sender (i.e. mobile or web app)
2. The sender discovers available Cast devices and presents a list to the user
3. The user selects a Cast device
4. The sender sends the Immich Custom Receiver application ID to the Cast device
5. The Cast device connects to Google's server and queries for the application URL using the application ID
6. The sender creates a temporary Immich session (15 minutes) and adds its token as the `sessionKey` query parameter to each media URL.
7. When the user selects a photo or video on the sender device, the preview URL of this media is sent to the Cast device together with the session key
8. The receiver requests the media from the Immich server over HTTPS. Asset media responses with a `sessionKey` include headers that allow the receiver's cross-origin request.

## Immich custom receiver

For performance reasons, Immich uses a Custom Receiver application since the other options did not give us enough control over the receiver application. Performance was an important consideration for this since the custom app allows us to preload next and previous assets, greatly speeding up the navigation.

For a photo, the sender sends `SHOW_PHOTO` with the current photo's URL, optional previous and next photo URLs, and an optional thumbnail fallback URL. The receiver fetches and displays the current photo, preloads its neighbors, and responds with `PHOTO_READY` or `PHOTO_ERROR`. `CLEAR_PHOTO` clears the display. For these photo messages, the receiver accepts URLs only when their origin matches its own and their path starts with `/api/assets/`.

Videos use the standard Cast media namespace. The sender loads a one-item queue with repeat enabled and marks the video with `immichLoop` in the media's custom data; the custom receiver uses that flag to loop its video element. Cast sends a direct playback or original-media URL, not the HLS session URL used for local web playback.

## Local development

The receiver application must be hosted on a publicly available location for all Immich instances to reach. Immich hosts a central application at (URL to be determined), hosted as static assets on a Cloudflare Worker. This application is registered on the (Google Cast SDK Developer Console)[https://cast.google.com/publish/] under the Immich-managed account.

When developing the custom receiver app, do the following steps:

1. Create a Google Cast Developer Account in the [Google Cast SDK Developer Console](https://cast.google.com/publish/). Google charges a one-time, non-refundable **$5 USD registration fee**. Complete the account details and allow up to 48 hours for registration to finish.
2. Set up your Cast device with the Google Home app and connect it to the same Wi-Fi network as your computer.
3. In the Developer Console, choose **Add new application** and select **Custom Receiver**. Enter the receiver URL `https://your-immich-host/cast/receiver.html` and save. Record the application ID assigned by Google.
4. Register your Cast device in the same Developer Console: choose **Add new device**, enter its serial number and a description, then save. Wait at least 15 minutes for registration, then restart the device.
5. Ensure the Cast device can reach the receiver page and media URLs over HTTPS.
6. In the web app, enter the application ID under **Account Settings > Features > Cast > Receiver application ID override**.
7. In the mobile app, enter it under **Settings > Advanced > Receiver application ID override**.

## Testing

Unfortunately, automated testing is not possible with casting, so we have to do these test scenarios manually. A few acceptance tests are listed here and should be done from both web, Android, and iOS:

- Start casting and confirm the Cast picker opens and launches the custom Immich receiver and it loads the Immich splash screen.
- Cast a photo. Confirm it loads, then navigate to the previous and next photos using the sender. Navigate quickly across several photos and confirm the receiver ends on the selected photo. There should be no black frames between loading photos.
- Cast a video. Confirm it plays, loops at the end, and responds to play, pause, seek, and stop actions from the sender.
- While playing a video from Android, changing the device volume should change the cast volume.
- Switch between photos and videos during an active session. Confirm the previous media stops and does not replace or interrupt the newly selected asset.
- Disconnect from the sender and from the Cast device, then reconnect. Confirm the receiver name and current casting state recover correctly.
- Make the Immich server inaccessible for the Cast device, but not the Immich client. When casting, it should not fail silently but show clear error message.

Another complication is the difference between different Cast device generations. Care must be taking when making changes since the device you are testing on might be different to the devices used by our users.
