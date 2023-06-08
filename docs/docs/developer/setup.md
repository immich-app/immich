---
sidebar_position: 2
---

# Setup

## Environment

### Server and web app

This environment includes the following services:

- Core server - `/server/src/immich`
- Machine learning - `/machine-learning`
- Microservices - `/server/src/microservicess`
- Web app - `/web`
- Redis
- PostgreSQL development database with exposed port `5432` so you can use any database client to acess it
- NGINX Proxy - `nginx/nginx.conf`

All the services are packaged to run as with single Docker Compose command.

### Instructions

1. Clone the project repo.
2. Run `cp docker/example.env docker/.env`.
3. Edit `docker/.env` to provide values for the required variable `UPLOAD_LOCATION`.
4. From the root directory, run:

```bash title="Start development server"
make dev # required Makefile installed on the system.
```

5. Access the dev instance in your browser at http://localhost:2283, or connect via the mobile app.

All the services will be started with hot-reloading enabled for a quick feedback loop.

You can access the web from `http://your-machine-ip:2283` or `http://localhost:2283` and access the server from the mobile app at `http://your-machine-ip:2283/api`

### Mobile app

The mobile app `(/mobile)` will required Flutter toolchain to be installed on your system.

Please refer to the [Flutter's official documentation](https://flutter.dev/docs/get-started/install) for more information on setting up the toolchain on your machine.

### Connect to a remote backend

If you only want to do web development connected to an existing, remote backend, follow these steps:

1. Enter the web directory - `cd web/`
2. Install web dependencies - `npm i`
3. Start the web development server

```
PUBLIC_IMMICH_SERVER_URL=https://demo.immich.app/api npm run dev
```

## IDE setup

### Lint / format extensions

Setting these in the IDE give a better developer experience, auto-formatting code on save, and providing instant feedback on lint issues.

### VSCode

Install `Flutter`, `Prettier`, `ESLint` and `Svelte` extensions.

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
    "editor.wordBasedSuggestions": false,
    "editor.defaultFormatter": "Dart-Code.dart-code"
  }
}
```
