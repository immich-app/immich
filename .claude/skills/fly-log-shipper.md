# Fly.io Log Shipper Management

Manage the fly-log-shipper deployment that ships logs from Fly.io apps to Better Stack.

## Configuration

- **App name:** `immich-logs`
- **Config path:** `/mnt/e/Immich/immich-fly-infra/log-shipper/`
- **Region:** `ord`

### Required Secrets

| Secret | Description |
|--------|-------------|
| `ACCESS_TOKEN` | Fly.io org token for NATS access |
| `BETTERSTACK_TOKEN` | Better Stack source token |

### Required Environment Variables (fly.toml)

| Env | Value | Description |
|-----|-------|-------------|
| `ORG` | `immich-199` | Fly.io org slug (not display name) |

## Common Tasks

### Check Status

```bash
fly status -a immich-logs
fly logs -a immich-logs --no-tail | tail -30
```

### Debug Failures

1. **NATS Authorization Violation** - Wrong `ORG` value or invalid `ACCESS_TOKEN`
   ```bash
   # Regenerate org token
   fly tokens create org -o immich-199
   fly secrets set ACCESS_TOKEN="FlyV1 ..." -a immich-logs
   ```

2. **Missing env var** - Check required secrets
   ```bash
   fly secrets list -a immich-logs
   ```

3. **Sink healthcheck failed** - Wrong Better Stack URL or token
   - Get correct values from Better Stack API:
   ```bash
   curl -s "https://telemetry.betterstack.com/api/v1/sources" \
     -H "Authorization: Bearer $BETTERSTACK_API_TOKEN"
   ```
   - Look for `ingesting_host` and `token` in response

### Check Built-in Vector Config

```bash
fly ssh console -a immich-logs -C "cat /etc/vector/vector.toml"
```

Key facts about fly-log-shipper:
- Built-in source is named `nats`
- Built-in transform is named `log_json` (already parsed JSON)
- Default sink is `blackhole` (discards logs)
- Custom sinks should use `inputs = ["log_json"]`

### Deploy Changes

```bash
cd /mnt/e/Immich/immich-fly-infra/log-shipper
fly deploy
```

### Test Log Ingestion

```bash
# Send test log directly to Better Stack
curl -X POST "https://s1672890.eu-nbg-2.betterstackdata.com" \
  -H "Authorization: Bearer $BETTERSTACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test log", "level": "info"}'
```

## vector.toml Template

```toml
# Custom sinks for fly-log-shipper
# Built-in: nats source -> log_json transform -> blackhole sink
# Add your sink that reads from log_json

[sinks.logtail]
type = "http"
inputs = ["log_json"]
uri = "https://${INGESTING_HOST}"
method = "post"
encoding.codec = "json"

[sinks.logtail.request]
headers.Authorization = "Bearer ${BETTERSTACK_TOKEN}"
```

## Better Stack API

### List Sources
```bash
curl -s "https://telemetry.betterstack.com/api/v1/sources" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN"
```

Response contains:
- `token` - Source token for ingestion
- `ingesting_host` - Correct URL for your region (e.g., `s1672890.eu-nbg-2.betterstackdata.com`)

### Query Logs
```bash
curl -s "https://telemetry.betterstack.com/api/v1/query?source_ids=SOURCE_ID&query=SEARCH_TERM" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN"
```

## Current Configuration

**Better Stack Source:**
- ID: `1672890`
- Name: `fly.io`
- Host: `s1672890.eu-nbg-2.betterstackdata.com`
- Token: `aALxqTnpKTeXXcKsMb9cJPN3`
