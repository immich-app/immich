---
title: Webhooks
description: Emit Immich events to external systems
---

Immich can be configured to forward internal events (such as `PersonCreate`, `AssetCreate`, etc.) to external HTTP endpoints. This is useful for triggering automations, updating downstream systems, or gathering analytics without modifying the core application.

## Enable the webhook dispatcher

The webhook dispatcher is disabled by default. To enable it, point the server to a JSON configuration file via the `IMMICH_WEBHOOKS_CONFIG` environment variable:

```bash
IMMICH_WEBHOOKS_CONFIG=/absolute/path/to/webhooks.json
```

> The path must be absolute. If the variable is not set (or the file is missing), the dispatcher will not load and no webhook jobs will be queued.

## Configuration file format

```json
{
  "webhooks": [
    {
      "id": "person-hooks",
      "events": ["PersonCreate", "PersonUpdate", "PersonDelete"],
      "url": "https://example.com/hooks/immich",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer <token>",
        "X-Webhook-Secret": "<secret>"
      },
      "timeoutMs": 15000,
      "retries": 5,
      "backoffMs": 3000,
      "includeServerEvents": false
    }
  ]
}
```

| Field | Required | Description |
| --- | --- | --- |
| `id` | No | Friendly identifier used in logs (defaults to `webhook-<index>`). |
| `events` | Yes | Array of event names (matches `EmitEvent` values, e.g. `PersonCreate`). |
| `url` | Yes | Destination endpoint. |
| `method` | No | HTTP method (`POST`, `PUT`, or `PATCH`, default: `POST`). |
| `headers` | No | Additional request headers (use for authentication/secrets). |
| `timeoutMs` | No | Request timeout in milliseconds (default: `10000`). |
| `retries` | No | Number of delivery attempts (default: `3`). |
| `backoffMs` | No | Initial backoff (milliseconds) for exponential retry (default: `2000`). |
| `includeServerEvents` | No | Deliver events that originate from internal server processes (`false` by default). |

## Delivery details

- Payload body shape:

```json
{
  "id": "8538265e-4b35-4a36-af7f-9ea850ce17d4",
  "eventName": "PersonCreate",
  "timestamp": "2025-11-20T12:34:56.789Z",
  "payload": { "... event data ..." }
}
```

- Default headers (`Content-Type`, `X-Immich-Event`, `X-Immich-Delivery-Id`, `X-Immich-Timestamp`) are added automatically unless you override them.
- Deliveries run in the background via the `WebhookDelivery` BullMQ job (queue: `backgroundTask`). Failed attempts respect the configured retry/backoff policy.

## Reloading configuration

The dispatcher reads the configuration during application bootstrap. Update the JSON file and restart the server to apply changes.

## Troubleshooting

- Check the server logs (`WebhookService`) for validation or delivery failures.
- Ensure the target endpoint responds with a `2xx` status code; non-success responses will trigger retries.
- If no webhooks are firing, confirm the environment variable points to an existing file and that the JSON validates against the schema above.

