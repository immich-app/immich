# Use a config file

This guide sets up a config file so Immich's system settings come from a file you control instead of from the web UI. See the [config file reference](/reference/config-file) for the format, the full list of keys, and exactly how values are resolved.

:::note
Once a config file is in use, the settings under `Administration > Settings` become read-only. Removing `IMMICH_CONFIG_FILE` restores UI editing.
:::

## Step 1 - Create the config file

Create a JSON file (e.g. `immich-config.json`) next to your `docker-compose.yml`. YAML is also supported.

The file only needs the keys you want to change — everything else falls back to its default. To start from your current settings instead, use the button in `Administration > Settings` that copies the current configuration to your clipboard, then paste it into the file.

For a minimal example, this enables the storage template and nothing else:

```json title="immich-config.json"
{
  "storageTemplate": {
    "enabled": true,
    "template": "{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}"
  }
}
```

The [config file reference](/reference/config-file#default-configuration) lists every available key with its default value.

## Step 2 - Point Immich at the file

Set `IMMICH_CONFIG_FILE` in your `.env` file to the path of the config file **inside the container**:

```ini title=".env"
IMMICH_CONFIG_FILE=/config/immich-config.json
```

:::info Docker Compose
In your `.env` file, `UPLOAD_LOCATION` and `DB_DATA_LOCATION` refer to locations on the host, but `IMMICH_CONFIG_FILE` refers to a location inside the container. Reuse the variable in `docker-compose.yml` so the two can't drift apart:

```yaml title="docker-compose.yml"
volumes:
  - ./immich-config.json:${IMMICH_CONFIG_FILE}
```

:::

:::note
If you run separate `microservices` workers, mount the config file into those containers as well, at the same path.
:::

## Step 3 - Restart Immich

```bash
docker compose up -d
```

Immich reads the config file at startup, so restart the containers after every change to the file.

To confirm it took effect, open `Administration > Settings` — the settings should now be read-only. If the server fails to start, check its logs: an invalid config file is a fatal error, and the log names the key that failed validation.
