# Chromecast support

Immich supports Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub from the web and mobile apps. This feature is experimental and has several important limitations listed below.

## Enable Google Cast Support

Google Cast support is disabled by default. The web UI uses Google-provided scripts and must retrieve them from Google servers when the page loads. This is a privacy concern for some and is thus opt-in.

You can enable Google Cast support through `Account Settings > Features > Cast > Google Cast`

<img src={require('./img/gcast-enable.webp').default} width="70%" title='Enable Google Cast Support' />

## Limitations

To use casting with Immich, there are a few prerequisites:

1. Your instance must be accessed via an HTTPS connection in order for the casting menu to show.
2. Your Cast device must be able to reach your instance over HTTPS and resolve its hostname.
3. Videos must be in a format that is compatible with Google Cast. For more info, check out [Google's documentation](https://developers.google.com/cast/docs/media)
4. Real-time HLS transcoding is used for local web playback, but Cast video currently uses a direct playback URL. Cast-compatible HLS authentication and controls are still being developed.

## Experimental custom receiver for faster photo navigation

The default Google receiver cannot queue or preload photos. To test receiver-side preloading from the web app:

1. In the Google Cast SDK Developer Console, register a **Custom Receiver** with the receiver URL `https://your-immich-host/cast/receiver.html`. Register your Chromecast as a development device if the application is unpublished.
2. Set `VITE_IMMICH_CAST_RECEIVER_APP_ID` to the resulting application ID when starting the Immich web development server (or when building the web app), then reload the web app and start a new Cast session.
3. Ensure the Chromecast can access both the receiver URL and Immich's media URLs over HTTPS. If you use Cloudflare Access or another IP allowlist, the Chromecast must be allowed through it.

With this receiver, the web app sends the current photo and its previous/next URLs to the Chromecast. The receiver keeps the current photo visible until the selected photo is ready. It downloads, decodes, and renders both adjacent photos into cached canvases, so selecting a prepared neighbor does not need another download or decode. The canvases are kept in receiver memory rather than displayed until selected. Videos play on the receiver's own media element, which keeps the stream buffered when it loops so playback wraps from the last frame to the first without rebuffering. Without `VITE_IMMICH_CAST_RECEIVER_APP_ID`, the web app continues to use Google's default receiver, which rebuffers videos on every loop. The mobile app currently continues to use the default receiver.
