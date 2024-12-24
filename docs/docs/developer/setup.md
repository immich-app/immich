---
sidebar_position: 2
---

# Setup

:::note
If there's a feature you're planning to work on, just give us a heads up in [Discord](https://discord.com/channels/979116623879368755/1071165397228855327) so we can:

1. Let you know if it's something we would accept into Immich
2. Provide any guidance on how something like that would ideally be implemented
3. Ensure nobody is already working on that issue/feature so we don't duplicate effort

Thanks for being interested in contributing 😊
:::

## Environment

### Services

This environment includes the services below. Additional details are available in each service's README.

- Server - [`/server`](https://github.com/immich-app/immich/tree/main/server)
- Web app - [`/web`](https://github.com/immich-app/immich/tree/main/web)
- Machine learning - [`/machine-learning`](https://github.com/immich-app/immich/tree/main/machine-learning)
- Redis
- PostgreSQL development database with exposed port `5432` so you can use any database client to access it

All the services are packaged to run as with single Docker Compose command.

### Server and web apps

1. Clone the project repo.
2. Run `cp docker/example.env docker/.env`.
3. Edit `docker/.env` to provide values for the required variable `UPLOAD_LOCATION`.
4. From the root directory, run:

```bash title="Start development server"
make dev # required Makefile installed on the system.
```

5. Access the dev instance in your browser at http://localhost:3000, or connect via the mobile app.

All the services will be started with hot-reloading enabled for a quick feedback loop.

You can access the web from `http://your-machine-ip:3000` or `http://localhost:3000` and access the server from the mobile app at `http://your-machine-ip:3000/api`

**Notes:**

- The "web" development container runs with uid 1000. If that uid does not have read/write permissions on the mounted volumes, you may encounter errors
- In case of rootless docker setup, you need to use root within the container, otherwise you will encounter read/write permission related errors, see comments in `docker/docker-compose.dev.yml`.

#### Connect web to a remote backend

If you only want to do web development connected to an existing, remote backend, follow these steps:

1. Build the Immich SDK - `cd open-api/typescript-sdk && npm i && npm run build && cd -`
2. Enter the web directory - `cd web/`
3. Install web dependencies - `npm i`
4. Start the web development server

```bash
IMMICH_SERVER_URL=https://demo.immich.app/ npm run dev
```

### Mobile app

The mobile app `(/mobile)` will required Flutter toolchain 3.13.x to be installed on your system.

Please refer to the [Flutter's official documentation](https://flutter.dev/docs/get-started/install) for more information on setting up the toolchain on your machine.

The mobile app asks you what backend to connect to. You can utilize the demo backend (https://demo.immich.app/) if you don't need to change server code or upload photos. Alternatively, you can run the server yourself per the instructions above.

## IDE setup

### Lint / format extensions

Setting these in the IDE give a better developer experience, auto-formatting code on save, and providing instant feedback on lint issues.

### Dart Code Metrics

The mobile app uses DCM (Dart Code Metrics) for linting and metrics calculation. Please refer to the [Getting Started](https://dcm.dev/docs/) page for more information on setting up DCM

Note: Activating the license is not required.

### VSCode

Install `Flutter`, `DCM`, `Prettier`, `ESLint` and `Svelte` extensions.

in User `settings.json` (`cmd + shift + p` and search for `Open User Settings JSON`) add the following:

```json title="settings.json"
{
  "editor.formatOnSave": true,
  "[javascript][typescript][css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2,
    "editor.formatOnSave": true
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode",
    "editor.tabSize": 2
  },
  "svelte.enable-ts-plugin": true,
  "eslint.validate": ["javascript", "svelte"],
  "[dart]": {
    "editor.formatOnSave": true,
    "editor.selectionHighlight": false,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    "editor.suggestSelection": "first",
    "editor.tabCompletion": "onlySnippets",
    "editor.wordBasedSuggestions": "off",
    "editor.defaultFormatter": "Dart-Code.dart-code"
  }
}
```
