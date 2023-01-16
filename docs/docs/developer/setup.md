---
sidebar_position: 2
---

# Setup

## Environment

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

### Instructions

1. Clone the project repo.
2. Run `cp docker/.env.example docker/.env`.
3. Edit `docker/.env` to provide values for the required variables `UPLOAD_LOCATION` and `JWT_SECRET`.
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

## Database migrations

After making any changes in the `server/libs/database/src/entities`, a database migration need to run in order to register the changes in the database. Follow the steps below to create a new migration.

1. Attached to the server container shell.
2. Run

```bash
npm run typeorm -- migration:generate ./libs/infra/src/db/<migration-name> -d ./libs/infra/src/db/config/database.config.ts
```

3. Check if the migration file makes sense.
4. Move the migration file to folder `server/libs/database/src/migrations` in your code editor.
