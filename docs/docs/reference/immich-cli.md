# Immich CLI

Immich CLI is a command-line-interface (CLI) that uploads media to an Immich instance. It is available as both an npm package and a Docker image.

This page describes every command and option. For worked examples, see [Upload media with the CLI](/user-guide/upload-media-with-the-cli).

## Install

### npm package

Immich CLI is published as [`@immich/cli`](https://www.npmjs.com/package/@immich/cli) on the npm registry and requires a minimum [Node.js](https://nodejs.org/) version of `v20.x`.

```bash
npm i -g @immich/cli
```

If you previously installed the legacy CLI, uninstall it first:

```bash
npm uninstall -g immich
```

### Docker

Immich CLI is available as a Docker image on both [GitHub](https://hub.docker.com/r/immichapp/immich-cli) and [Docker Hub](https://hub.docker.com/r/immichapp/immich-cli). See below for the image name on each platform.

| Platform   | Image name                      |
| ---------- | ------------------------------- |
| GitHub     | `ghcr.io/immich-app/immich-cli` |
| Docker Hub | `immichapp/immich-cli`          |

The image entrypoint is the `immich` command itself, so arguments passed to `docker run` are passed straight to the CLI.

## Global options

The following options apply to all commands.

| Option                               | Environment variable  | Default value       | Description                                             |
| ------------------------------------ | --------------------- | ------------------- | ------------------------------------------------------- |
| `-d, --config-directory <directory>` | `IMMICH_CONFIG_DIR`   | `~/.config/immich/` | Configuration directory where `auth.yml` will be stored |
| `-u, --url [url]`                    | `IMMICH_INSTANCE_URL` |                     | Immich server URL                                       |
| `-k, --key [key]`                    | `IMMICH_API_KEY`      |                     | Immich API key                                          |
| `-V, --version`                      |                       |                     | Output the version number                               |
| `-h, --help`                         |                       |                     | Display help for command                                |

## Commands

### `login`

`immich login <url> <key>`

Login using an API key. The credentials are stored in `auth.yml` inside the configuration directory. Also available as `immich login-key`.

| Argument | Description       |
| -------- | ----------------- |
| `url`    | Immich server URL |
| `key`    | Immich API key    |

### `logout`

`immich logout`

Removes the stored credentials.

### `server-info`

`immich server-info`

Displays information about the server, including its version.

### `upload`

`immich upload [paths...] [options]`

| Option                       | Environment variable        | Default value                  | Description                                                          |
| ---------------------------- | --------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `[paths...]`                 |                             |                                | One or more paths to assets to be uploaded                           |
| `-r, --recursive`            | `IMMICH_RECURSIVE`          | `false`                        | Recursively crawl directories                                        |
| `-i, --ignore <pattern>`     | `IMMICH_IGNORE_PATHS`       |                                | Pattern to ignore                                                    |
| `--skip-hash`                | `IMMICH_SKIP_HASH`          | `false`                        | Don't hash files before upload                                       |
| `-H, --include-hidden`       | `IMMICH_INCLUDE_HIDDEN`     | `false`                        | Include hidden folders                                               |
| `-a, --album`                | `IMMICH_AUTO_CREATE_ALBUM`  | `false`                        | Automatically create albums based on folder name                     |
| `-A, --album-name <name>`    | `IMMICH_ALBUM_NAME`         |                                | Add all assets to specified album (conflicts with `--album`)         |
| `--visibility <visibility>`  | `IMMICH_VISIBILITY`         |                                | Set the visibility of uploaded assets                                |
| `-n, --dry-run`              | `IMMICH_DRY_RUN`            | `false`                        | Don't perform any actions, just show what will be done               |
| `-c, --concurrency <number>` | `IMMICH_UPLOAD_CONCURRENCY` | number of CPU cores, minus one | Number of assets to upload at the same time                          |
| `-j, --json-output`          | `IMMICH_JSON_OUTPUT`        | `false`                        | Output detailed information in json format                           |
| `--delete`                   | `IMMICH_DELETE_ASSETS`      |                                | Delete local assets after upload                                     |
| `--delete-duplicates`        | `IMMICH_DELETE_DUPLICATES`  |                                | Delete local assets that are duplicates (already exist on server)    |
| `--no-progress`              | `IMMICH_PROGRESS_BAR`       | progress bars are shown        | Hide progress bars                                                   |
| `--watch`                    | `IMMICH_WATCH_CHANGES`      | `false`                        | Watch for changes and upload automatically (implies `--no-progress`) |

`--visibility` accepts `archive`, `timeline`, `hidden`, or `locked`. `--dry-run` conflicts with `--skip-hash`, and `--album-name` conflicts with `--album`.

With `--json-output`, the printed JSON contains three keys: `newFiles`, `duplicates`, and `newAssets`.
