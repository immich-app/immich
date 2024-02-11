# Reverse Proxy

Users can deploy a custom reverse proxy that forwards requests to Immich. This way, the reverse proxy can handle TLS termination, load balancing, or other advanced features. All reverse proxies between Immich and the user must forward all headers and set the `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` and `X-Forwarded-For` headers to their appropriate values. Additionally, your reverse proxy should allow for big enough uploads. By following these practices, you ensure that all custom reverse proxies are fully compatible with Immich.

### Nginx example config

Below is an example config for nginx. Make sure to include `client_max_body_size 50000M;` also in a `http` block in `/etc/nginx/nginx.conf`.

```nginx
server {
    server_name <snip>

    client_max_body_size 50000M;

    location / {
        proxy_pass http://<snip>:2283;
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # http://nginx.org/en/docs/http/websocket.html
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_redirect off;
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

```
<VirtualHost *:80>
    ServerName <snip>

    ProxyRequests off
    ProxyVia on

    RewriteEngine On
    RewriteCond %{REQUEST_URI}  ^/api/socket.io            [NC]
    RewriteCond %{QUERY_STRING} transport=websocket    [NC]
    RewriteRule /(.*)           ws://localhost:2283/$1 [P,L]

    ProxyPass        /api/socket.io ws://localhost:2283/api/socket.io
    ProxyPassReverse /api/socket.io ws://localhost:2283/api/socket.io

    <Location />
        ProxyPass http://localhost:2283/
        ProxyPassReverse http://localhost:2283/
    </Location>
</VirtualHost>
```
