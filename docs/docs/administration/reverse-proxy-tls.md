# TLS Reverse Proxy

Users can deploy a custom reverse proxy that forwards requests to Immich. This way, the reverse proxy can handle TLS termination, load balancing, or other advanced features. All reverse proxies between Immich and the user must forward all headers and set the `Host`, `X-Real-IP`, `X-Forwarded-Proto` and `X-Forwarded-For` headers to their appropriate values. Additionally, your reverse proxy should allow for big enough uploads. By following these practices, you ensure that all custom reverse proxies are fully compatible with Immich.

:::note
The Repair page can take a long time to load. To avoid server timeouts or errors, we recommend specifying a timeout of at least 10 minutes on your proxy server.
:::

:::caution
Immich does not support being served on a sub-path such as `location /immich {`. It has to be served on the root path of a (sub)domain.
:::

### Nginx TLS example config

Below is an example config for nginx. Make sure to set `public_url` to the front-facing URL of your instance, `mydomain.com` to the domain used and `backend_url` to the path of the Immich server.

`immich-tls.conf`
```nginx
server {
    listen 443 ssl;
    server_name <public_url>;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/<mydomain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<mydomain.com>/privkey.pem;

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

### Nginx TLS + Access Key example config

Below is an example config for nginx. Make sure to set `public_url` to the front-facing URL of your instance, `mydomain.com` to the domain used, `12345` to your new http access key and `backend_url` to the path of the Immich server.

`immich-tls-header.conf`
```nginx
server {
    listen 4000 ssl;
    server_name <public_url>;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/<mydomain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<mydomain.com>/privkey.pem;

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

    # Check if the header 'X-Access-Key' contains the value '12345'
    if ($http_x_access_key != "<12345>") {
        return 403; # Deny access
    }

    location / {
        proxy_pass http://<backend_url>:2283;
    }
}
```
