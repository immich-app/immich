# Reverse proxy requirements

A custom reverse proxy can sit in front of Immich to handle TLS termination, load balancing, or other advanced features. Any proxy between Immich and the user must meet the requirements below. For configurations that satisfy them, see [Set up a reverse proxy](/administration/set-up-a-reverse-proxy).

## Headers

All headers must be forwarded, and these must be set to their appropriate values:

| Header              | Value                                       |
| ------------------- | ------------------------------------------- |
| `Host`              | The front-facing host                       |
| `X-Real-IP`         | The client address                          |
| `X-Forwarded-Proto` | The scheme the client used (`http`/`https`) |
| `X-Forwarded-For`   | The client address chain                    |

WebSocket upgrades must also be passed through.

## Upload size

The proxy must allow uploads large enough for the assets being sent. A body-size limit lower than the largest asset will fail uploads.

## Timeouts

Response timeouts need to be long enough for large uploads. A default of 60 seconds is too low and causes video uploads to stop after a minute (error code 499).

## Path

Immich does not support being served on a sub-path such as `location /immich {`. It has to be served on the root path of a (sub)domain.

## Let's Encrypt http-01

If the reverse proxy uses the [Let's Encrypt](https://letsencrypt.org/) [http-01 challenge](https://letsencrypt.org/docs/challenge-types/#http-01-challenge), verify that the Immich well-known endpoint (`/.well-known/immich`) is routed to Immich. Otherwise it will likely be routed elsewhere and the mobile app may run into connection issues.
