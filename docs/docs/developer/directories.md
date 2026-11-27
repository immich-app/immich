---
title: Directories
---

# Repository folder structure

Our [GitHub Repository](https://github.com/immich-app/immich) is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) and includes the following folders:

| Folder              | Description                                                          |
| :------------------ | :------------------------------------------------------------------- |
| `.github/`          | GitHub templates and action workflows                                |
| `.vscode/`          | VS Code debug launch profiles                                        |
| `packages/cli`      | Source code for the CLI                                              |
| `packages/sdk`      | Source code for the generated OpenAPI SDK                            |
| `packages/scripts`  | Scripts for version bumps and draft releases                         |
| `docker/`           | Docker Compose resources for dev, test, production                   |
| `design/`           | Screenshots and logos for the README                                 |
| `docs/`             | Source code for the [https://immich.app](https://immich.app) website |
| `machine-learning/` | Source code for the `immich-machine-learning` Docker image           |
| `mobile/`           | Source code for the mobile app, both Android and iOS                 |
| `server/`           | Source code for the `immich-server` Docker image                     |
| `web/`              | Source code for the `web`                                            |
