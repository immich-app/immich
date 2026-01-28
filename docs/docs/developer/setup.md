---
sidebar_position: 2
---

# Setup

:::warning
Make sure to read the [`CONTRIBUTING.md`](https://github.com/immich-app/immich/blob/main/CONTRIBUTING.md) before you dive into the code.
:::

:::note
If there's a feature you're planning to work on, just give us a heads up in [#contributing](https://discord.com/channels/979116623879368755/1071165397228855327) on [our Discord](https://discord.immich.app) so we can:

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
4. Install dependencies - `pnpm i`
5. From the root directory, run:

```bash title="Start development server"
make dev # required Makefile installed on the system.
```

5. Access the dev instance in your browser at http://localhost:3000, or connect via the mobile app.

All the services will be started with hot-reloading enabled for a quick feedback loop.

You can access the web from `http://your-machine-ip:3000` or `http://localhost:3000` and access the server from the mobile app at `http://your-machine-ip:3000/api`

**Notes:**

- The "web" development container runs with uid 1000. If that uid does not have read/write permissions on the mounted volumes, you may encounter errors

#### Connect web to a remote backend

If you only want to do web development connected to an existing, remote backend, follow these steps:

1. Build the Immich SDK - `cd open-api/typescript-sdk && pnpm i && pnpm run build && cd -`
2. Enter the web directory - `cd web/`
3. Install web dependencies - `pnpm i`
4. Start the web development server

```bash
IMMICH_SERVER_URL=https://demo.immich.app/ pnpm run dev
```

If you're using PowerShell on Windows you may need to set the env var separately like so:

```powershell
$env:IMMICH_SERVER_URL = "https://demo.immich.app/"
pnpm run dev
```

#### `@immich/ui`

To see local changes to `@immich/ui` in Immich, do the following:

1. Install `@immich/ui` as a sibling to `immich/`, for example `/home/user/immich` and `/home/user/ui`
2. Build the `@immich/ui` project via `pnpm run build`
3. Uncomment the corresponding volume in web service of the `docker/docker-compose.dev.yaml` file (`../../ui:/usr/ui`)
4. Uncomment the corresponding alias in the `web/vite.config.js` file (`'@immich/ui': path.resolve(\_\_dirname, '../../ui')`)
5. Uncomment the import statement in `web/src/app.css` file `@import '/usr/ui/dist/theme/default.css';` and comment out `@import '@immich/ui/theme/default.css';`
6. Start up the stack via `make dev`
7. After making changes in `@immich/ui`, rebuild it (`pnpm run build`)

### Mobile app

#### Setup

1. Setup Flutter toolchain using FVM.
2. Run `flutter pub get` to install the dependencies.
3. Run `make translation` to generate the translation file.
4. Run `fvm flutter run` to start the app.

#### Translation

To add a new translation text, enter the key-value pair in the `i18n/en.json` in the root of the immich project. Then, from the `mobile/` directory, run

```bash
make translation
```

The mobile app asks you what backend to connect to. You can utilize the demo backend (https://demo.immich.app/) if you don't need to change server code or upload photos. Alternatively, you can run the server yourself per the instructions above.

## IDE setup

### Lint / format extensions

Setting these in the IDE give a better developer experience, auto-formatting code on save, and providing instant feedback on lint issues.

### Dart Code Metrics

The mobile app uses DCM (Dart Code Metrics) for linting and metrics calculation. Please refer to the [Getting Started](https://dcm.dev/docs/) page for more information on setting up DCM

Note: Activating the license is not required.

### VSCode

Install `Flutter`, `DCM`, `Prettier`, `ESLint` and `Svelte` extensions. These extensions are listed in the `extensions.json` file under `.vscode/` and should appear as workspace recommendations.

Here are the settings we use, they should be active as workspace settings (`settings.json`):

```json title="settings.json"
{
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[dart]": {
    "editor.defaultFormatter": "Dart-Code.dart-code",
    "editor.formatOnSave": true,
    "editor.selectionHighlight": false,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    "editor.suggestSelection": "first",
    "editor.tabCompletion": "onlySnippets",
    "editor.wordBasedSuggestions": "off"
  },
  "[javascript]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "source.removeUnusedImports": "explicit"
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[svelte]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "source.removeUnusedImports": "explicit"
    },
    "editor.defaultFormatter": "svelte.svelte-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "source.removeUnusedImports": "explicit"
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "cSpell.words": ["immich"],
  "editor.formatOnSave": true,
  "eslint.validate": ["javascript", "svelte"],
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.dart": "${capture}.g.dart,${capture}.gr.dart,${capture}.drift.dart",
    "*.ts": "${capture}.spec.ts,${capture}.mock.ts"
  },
  "svelte.enable-ts-plugin": true,
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```
