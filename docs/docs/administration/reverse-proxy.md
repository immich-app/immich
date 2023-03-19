# Reverse Proxy

When deploying Immich it is important to understand that a reverse proxy is required in front of the server and web container. The reverse proxy acts as an intermediary between the user and container, forwarding requests to the correct container based on the URL path.

## Default Reverse Proxy

Immich provides a default nginx reverse proxy preconfigured to perform the correct routing and set the necessary headers for the server and web container to use. These headers are crucial to redirect to the correct URL and determine the client's IP address.

## Using a Different Reverse Proxy

While the reverse proxy provided by Immich works well for basic deployments, some users may want to use a different reverse proxy. Fortunately, Immich is flexible enough to accommodate different reverse proxies. Users can either:

1. Add another reverse proxy on top of Immich's reverse proxy
2. Completely replace the default reverse proxy

## Adding a Custom Reverse Proxy

Users can deploy a custom reverse proxy that forwards requests to Immich's reverse proxy. This way, the new reverse proxy can handle TLS termination, load balancing, or other advanced features, while still delegating routing decisions to Immich's reverse proxy. All reverse proxies between Immich and the user must forward all headers and set the `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` and `X-Forwarded-For` headers to their appropriate values. By following these practices, you ensure that all custom reverse proxies are fully compatible with Immich.

## Replacing the Default Reverse Proxy

Replacing Immich's default reverse proxy is an advanced deployment and support may be limited. When replacing Immich's default proxy it is important to ensure that requests to `/api/*` are routed to the server container and all other requests to the web container. Additionally, the previously mentioned headers should be configured accordingly. You may find our [nginx configuration file](https://github.com/immich-app/immich/blob/main/nginx/templates/default.conf.template) a helpful reference.
