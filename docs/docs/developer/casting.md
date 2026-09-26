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

For a photo, the sender sends `SHOW_PHOTO` with the current photo's URL, optional previous and next photo URLs, and an optional thumbnail fallback URL. The receiver fetches and displays the current photo, preloads its neighbors, and responds with `PHOTO_READY` or `PHOTO_ERROR`. `CLEAR_PHOTO` clears the display. The receiver accepts media URLs only from its own origin under `/api/assets/`.

Videos use the standard Cast media namespace. The sender loads a single video with repeat enabled and marks it with `immichLoop` in the media's custom data; the custom receiver uses that flag to loop its video element. Cast video uses a direct playback URL rather than the HLS stream used for local web playback.

## Configure the custom receiver

When developing the custom receiver app, do the following steps:

1. Register a Custom Receiver in the Google Cast SDK Developer Console with the URL `https://your-immich-host/cast/receiver.html`. Register your Cast device as a development device if the application is unpublished.
2. Set `IMMICH_CAST_RECEIVER_APP_ID` to the resulting application ID in the Immich server environment, then restart the server. Both apps read the ID from the server. A custom receiver ID is required; neither app uses Google's Default Media Receiver.
3. Ensure the Cast device can reach the receiver page and media URLs over HTTPS.

For local development or troubleshooting, clients can override the server ID:

- Web: enter **Account Settings > Features > Cast > Receiver application ID override**. The value is saved in this browser and saving a Cast change reloads the page. Resolution order is browser override, `VITE_IMMICH_CAST_RECEIVER_APP_ID` build override, then the server ID.
- Mobile: open **Settings > Cast**, enable casting on this device, and save a **Receiver application ID override**. It takes precedence over the connected server's ID and applies to the next connection. Disconnect before editing it.

These overrides stay local and are not sent to the server. Clear the override to return to the configured receiver. Mobile casting is disabled by default independently of the web account preference.
