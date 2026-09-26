# Chromecast support

Immich supports Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub from the web and mobile apps.

## Enable Google Cast Support

Google Cast support is disabled by default. The web UI uses Google-provided scripts and must retrieve them from Google servers when the page loads. This is a privacy concern for some and is thus opt-in.

Configure `IMMICH_CAST_RECEIVER_APP_ID` on the server with your registered Immich custom receiver application ID, then restart the server. Both clients read this setting. Casting requires a custom receiver; there is no default receiver fallback. See [receiver setup](../developer/casting.md#configure-the-custom-receiver).

Enable casting on the web through `Account Settings > Features > Cast > Google Cast`, or on mobile through `Settings > Cast > Enable Google Cast on this device`. The mobile setting applies to this device independently of the web preference.

Both settings screens also provide a local receiver application ID override for development and troubleshooting. Clear it to use the configured receiver again.

<img src={require('./img/gcast-enable.webp').default} width="70%" title='Enable Google Cast Support' />

## Limitations

To use casting with Immich, there are a few prerequisites:

1. Your instance must be accessed via an HTTPS connection in order for the casting menu to show.
2. Your Cast device must be able to reach your instance over HTTPS and resolve its hostname.
3. Videos must be in a format that is compatible with Google Cast. For more info, check out [Google's documentation](https://developers.google.com/cast/docs/media)
4. Real-time HLS transcoding is used for local web playback, but Cast video currently uses a direct playback URL. Cast-compatible HLS authentication and controls are still being developed.
