# Chromecast support

Immich supports the Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub. This feature is considered experimental and has several important limitations listed below. Currently, this feature is only supported by the web client, support on Android and iOS is planned for the future.

## Limitations

To use casting with Immich, there are a few prerequisites:

1. Your instance must be accessed via an HTTPS connection in order for the casting menu to show.
2. Your instance must be publicly accessible via HTTPS and a DNS record for the server must be accessible via Google's DNS servers (`8.8.8.8` and `8.8.4.4`)
3. Videos must be in a format that is compatible with Google Cast. For more info, check out [Google's documentation](https://developers.google.com/cast/docs/media)
