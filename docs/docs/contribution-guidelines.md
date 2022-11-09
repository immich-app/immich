---
sidebar_position: 5
---

# Contribution guidelines

## Environment setup

### Server and web app

This environment includes the following services:

- Core server - `/server/apps/immich`
- Machine learning - `/machine-learning`
- Microservices - `/server/apps/microservicess`
- Web app - `/web`
- Redis
- PostgreSQL development database with exposed port `5432` so you can use any database client to acess it
- NGINX Proxy - `nginx/nginx.conf`

All the services are packaged to run as with single Docker Compose command.

After cloning the project, from the root directory run

```bash title="Start development server"
make dev # required Makefile installed on the system.
```

All the services will be started with hot-reloading enabled for a quick feedback loop.

### Mobile app

The mobile app `(/mobile)` will required Flutter toolchain to be installed on your system.

Please refer to the [Flutter's official documentation](https://flutter.dev/docs/get-started/install) for more information on setting up the toolchain on your machine.

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

## OpenAPI generator

OpenAPI is used to generate the client (Typescript, Dart) SDK. `openapi-generator-cli` can be installed [here](https://openapi-generator.tech/docs/installation/). When you add a new or modify an existing endpoint, you must run the command below to update the client SDK.

```bash
npm run api:generate # Run from the `server` directory
```
You can find the generated client SDK in the `web/src/api` for Typescript SDK and `mobile/openapi` for Dart SDK.
