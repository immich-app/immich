# Better Stack Logs API

Query and manage logs in Better Stack (formerly Logtail).

## Authentication

Better Stack uses two types of tokens:

| Token Type | Use | Where to Get |
|------------|-----|--------------|
| **API Token** | Query logs, manage sources | Settings -> API tokens |
| **Source Token** | Ingest logs | Shown in source settings |

Store API token as environment variable:
```bash
export BETTERSTACK_API_TOKEN="XwgfqcmHhtV6XzLPJ15Ari5n"
```

## API Endpoints

Base URL: `https://telemetry.betterstack.com/api/v1`

### List Sources

```bash
curl -s "https://telemetry.betterstack.com/api/v1/sources" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN"
```

### Get Source Details

```bash
curl -s "https://telemetry.betterstack.com/api/v1/sources/SOURCE_ID" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN"
```

### Query Logs

```bash
curl -s "https://telemetry.betterstack.com/api/v1/query" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN" \
  -G \
  --data-urlencode "source_ids=1672890" \
  --data-urlencode "query=level:error" \
  --data-urlencode "from=-1h"
```

Parameters:
- `source_ids` - Comma-separated source IDs
- `query` - Search query (Lucene syntax)
- `from` - Start time (ISO8601 or relative like `-1h`, `-5m`)
- `to` - End time (optional, defaults to now)
- `batch_size` - Number of results (default 50)

### Search Examples

```bash
# Find errors
query=level:error

# Search by asset ID
query=assetId:abc-123-def

# Search by machine
query=machineId:e784d1a1c

# Combine filters
query=level:error AND app.name:immich-server

# Full text search
query="thumbnail generation failed"
```

## Ingestion

Send logs directly to Better Stack:

```bash
curl -X POST "https://${INGESTING_HOST}" \
  -H "Authorization: Bearer ${SOURCE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Your log message",
    "level": "info",
    "assetId": "abc-123",
    "machineId": "e784d1a1c"
  }'
```

Note: `INGESTING_HOST` is region-specific (e.g., `s1672890.eu-nbg-2.betterstackdata.com`)

## Current Immich Configuration

| Setting | Value |
|---------|-------|
| API Token | `XwgfqcmHhtV6XzLPJ15Ari5n` |
| Source ID | `1672890` |
| Source Token | `aALxqTnpKTeXXcKsMb9cJPN3` |
| Ingesting Host | `s1672890.eu-nbg-2.betterstackdata.com` |

## Quick Commands

### Find failed jobs for an asset
```bash
curl -s "https://telemetry.betterstack.com/api/v1/query" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN" \
  -G \
  --data-urlencode "source_ids=1672890" \
  --data-urlencode "query=assetId:$ASSET_ID AND level:error" \
  --data-urlencode "from=-24h"
```

### Find all errors in last hour
```bash
curl -s "https://telemetry.betterstack.com/api/v1/query" \
  -H "Authorization: Bearer $BETTERSTACK_API_TOKEN" \
  -G \
  --data-urlencode "source_ids=1672890" \
  --data-urlencode "query=level:error" \
  --data-urlencode "from=-1h"
```

### Dashboard URL
https://telemetry.betterstack.com/team/465772/tail?source_ids=1672890
