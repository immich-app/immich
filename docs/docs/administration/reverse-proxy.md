# Reverse Proxy

Users can deploy a custom reverse proxy that forwards requests to Immich. This way, the reverse proxy can handle TLS termination, load balancing, or other advanced features. All reverse proxies between Immich and the user must forward all headers and set the `Host`, `X-Real-IP`, `X-Forwarded-Proto` and `X-Forwarded-For` headers to their appropriate values. Additionally, your reverse proxy should allow for big enough uploads. By following these practices, you ensure that all custom reverse proxies are fully compatible with Immich.

:::note
The Repair page can take a long time to load. To avoid server timeouts or errors, we recommend specifying a timeout of at least 10 minutes on your proxy server.
:::

### Nginx example config

Below is an example config for nginx. Make sure to set `public_url` to the front-facing URL of your instance, and `backend_url` to the path of the Immich server.

```nginx
server {
    server_name <public_url>;

    # allow large file uploads
    client_max_body_size 50000M;

    # Set headers
    proxy_set_header Host              $http_host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # enable websockets: http://nginx.org/en/docs/http/websocket.html
    proxy_http_version 1.1;
    proxy_set_header   Upgrade    $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_redirect     off;

    # set timeout
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    send_timeout       600s;

    location / {
        proxy_pass http://<backend_url>:2283;
    }
}
```

### Caddy example config

As an alternative to nginx, you can also use [Caddy](https://caddyserver.com/) as a reverse proxy (with automatic HTTPS configuration). Below is an example config.

```
immich.example.org {
    reverse_proxy http://<snip>:2283
}
```

### Apache example config

Below is an example config for Apache2 site configuration.

```ApacheConf
<VirtualHost *:80>
   ServerName <snip>
   ProxyRequests Off
   # set timeout in seconds
   ProxyPass / http://127.0.0.1:2283/ timeout=600 upgrade=websocket
   ProxyPassReverse / http://127.0.0.1:2283/
   ProxyPreserveHost On
</VirtualHost>
```

### Traefik Proxy example config

The example below is for Traefik version 3.

The most important is to increase the `respondingTimeouts` of the entrypoint used by immich. In this example of entrypoint `websecure` for port `443`. Per default it's set to 60s which leeds to videos stop uploading after 1 minute (Error Code 499). With this config it will fail after 10 minutes which is in most cases enough. Increase it if needed.

`traefik.yaml`

```yaml
[...]
entryPoints:
  websecure:
    address: :443
    # this section needs to be added
    transport:
      respondingTimeouts:
        readTimeout: 600s
        idleTimeout: 600s
        writeTimeout: 600s
```

The second part is in the `docker-compose.yml` file where immich is in. Add the Traefik specific labels like in the example.

`docker-compose.yml`

```yaml
services:
  immich-server:
    [...]
    labels:
      traefik.enable: true
      # increase readingTimeouts for the entrypoint used here
      traefik.http.routers.immich.entrypoints: websecure
      traefik.http.routers.immich.rule: Host(`immich.your-domain.com`)
      traefik.http.services.immich.loadbalancer.server.port: 2283
```

Keep in mind, that Traefik needs to communicate with the network where immich is in, usually done
by adding the Traefik network to the `immich-server`.
