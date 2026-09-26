# Chromecast support

Immich supports Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub from the web and mobile apps.

## Enable Google Cast Support

Google Cast support is disabled by default. The web UI uses Google-provided scripts and must retrieve them from Google servers when the page loads. This is a privacy concern for some and is thus opt-in.

Casting requires a custom receiver application ID. See [receiver setup](../developer/casting.md#local-development).

Enable casting on the web through `Account Settings > Features > Cast > Google Cast`, or on mobile through `Settings > Cast > Enable Google Cast on this device`. You need to enable this setting on every client you want to cast from; it does not carry across devices.

The web and mobile settings screens provide local receiver application ID overrides for development and troubleshooting. Set an ID in each client where you want to cast; these overrides are not sent to the server.

<img src={require('./img/gcast-enable.webp').default} width="70%" title='Enable Google Cast Support' />

## Limitations

To use casting with Immich, there are a few prerequisites:

1. Your Immich instance must be accessed via HTTPS using a real TLS certificate. Self-signed certificates are not supported by the Google Cast SDK.
2. Your Cast device must be able to reach your instance over HTTPS and resolve its hostname.

If you have a proxy or authentication in front of your instance, casting will not work. If you are able, try exempting the cast device from the authentication proxy.
