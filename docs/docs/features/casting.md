# Chromecast support

Immich supports the Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub. This feature is considered experimental and has several important limitations listed below. Currently, this feature is only supported by the web client, support on Android and iOS is planned for the future.

## Enable Google Cast Support

Google Cast support is disabled by default. The web UI uses Google-provided scripts and must retrieve them from Google servers when the page loads. This is a privacy concern for some and is thus opt-in.

You can enable Google Cast support through `Account Settings > Features > Cast > Google Cast`

<img src={require('./img/gcast-enable.webp').default} width="70%" title='Enable Google Cast Support' />

## Limitations

To use casting with Immich, there are a few prerequisites:

1. Your instance must be accessed via an HTTPS connection in order for the casting menu to show.
2. Your instance must be publicly accessible via HTTPS and a DNS record for the server must be accessible via Google's DNS servers (`8.8.8.8` and `8.8.4.4`)
3. Videos must be in a format that is compatible with Google Cast. For more info, check out [Google's documentation](https://developers.google.com/cast/docs/media)

## Limit server exposure

Exposing the entire Immich instance to the internet is not recommended, as using WireGuard or mTLS authentication is much safer.

In order to make casting work, at least in the mobile app, is possible to set an alternative instance public URL in the app, that only exposes the required endpoints for casting:

- /api/assets/{ID}/video/playback
- /api/assets/{ID}/thumbnail

In the mobile app you can set the alternative URL in `Account Settings > Networking > Casting URL`

<img src={require('./img/gcast-server-url.webp').default} width="70%" title='Server URL for Google Cast' />

Here it is an example of a reverse proxy with nginx that exposes only the required endpoints to the internet via HTTPS.

```
server {
    listen 443 ssl;
    server_name mypublicdomain.tld;

    # allow large file uploads
    client_max_body_size 50000M;

    # disable buffering uploads to prevent OOM on reverse proxy server and make uploads twice as fast (no pause)
    proxy_request_buffering off;

    # increase body buffer to avoid limiting upload speed
    client_body_buffer_size 1024k;

    # Set headers
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # enable websockets
    proxy_http_version 1.1;
    proxy_redirect     off;

    # set timeout
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    send_timeout       600s;

    # --- SSL Configuration ---
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    location ~ ^/api/assets/([^/]+)/video/playback$ {
        proxy_pass http://myServer.local:2283;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }

    location ~ ^/api/assets/([^/]+)/thumbnail$ {
        proxy_pass http://myServer.local:2283;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}
```
