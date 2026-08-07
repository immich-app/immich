# Logging

Immich logs to standard output, so logs are read with `docker logs` — see [Inspect containers and logs](/administration/inspect-containers-and-logs). Three environment variables control what is logged and how it is formatted.

## Log level

`IMMICH_LOG_LEVEL` sets the minimum severity that is logged. The levels, from most to least verbose:

| Level     | Notes                                             |
| --------- | ------------------------------------------------- |
| `verbose` | Very noisy; useful when diagnosing a specific job |
| `debug`   |                                                   |
| `log`     | The default, commonly known as `info`             |
| `warn`    |                                                   |
| `error`   |                                                   |
| `fatal`   | Only errors that stop the server                  |

The level can also be set from the web UI under `Administration > Settings > Logging`. When `IMMICH_LOG_LEVEL` is set, it takes precedence and the setting cannot be changed from the UI.

## Log format

`IMMICH_LOG_FORMAT` selects the output format.

| Value     | Output                                          |
| --------- | ----------------------------------------------- |
| `console` | The default. Human-readable, one line per entry |
| `json`    | One JSON object per line, for log aggregation   |

Use `json` for deployments that ship logs to a system such as Grafana Loki, the ELK stack, Datadog, or Splunk.

### JSON format

```json
{"level":"log","pid":36,"timestamp":1766533331507,"message":"Initialized websocket server","context":"WebsocketRepository"}
{"level":"warn","pid":48,"timestamp":1766533331629,"message":"Unable to open /build/www/index.html, skipping SSR.","context":"ApiService"}
{"level":"error","pid":36,"timestamp":1766533331690,"message":"Failed to load plugin immich-core:","context":"Error"}
```

Each object contains:

| Field       | Meaning                                       |
| ----------- | --------------------------------------------- |
| `level`     | Log level of the entry                        |
| `pid`       | Process ID that emitted it                    |
| `timestamp` | Unix timestamp in milliseconds                |
| `message`   | The log message                               |
| `context`   | Service or component that generated the entry |

## Color

Console output is color-coded by default. Setting `NO_COLOR` to any non-empty value disables it, following the [NO_COLOR convention](https://no-color.org/).

| Variable   | Effect                                                  |
| ---------- | ------------------------------------------------------- |
| `NO_COLOR` | Any non-empty value disables color-coded console output |

This is worth setting when logs are captured to a file or piped into a tool that does not interpret ANSI escape codes, since the escape sequences would otherwise appear as literal characters. It has no effect on `json` output, which is never colorized.

See [Environment Variables](/reference/environment-variables#general) for these variables alongside the rest, and [Monitor Immich](/administration/monitor-immich) for wiring logs into a monitoring stack.
