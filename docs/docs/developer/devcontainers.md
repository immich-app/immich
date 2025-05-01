---
sidebar_position: 3
---

## Dev Containers

### Getting started with Dev Containers

The Dev Container is a fully featured dev environment. It is a portable way, using docker containers, to set up a dev environment. With a single click, you can get started with a Immich environment, on Mac, Linux or Windows or the cloud, like GitHub codespaces.

[![Open in VSCode Containers](https://img.shields.io/static/v1?label=VSCode%20DevContainer&message=Immich&color=blue)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/immich-app/immich/)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/immich-app/immich/)

[More info on dev containers here](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)

### Details

The Immich dev container runs the web and server in one container, and redis and ML each in their own container.

By default, if you don't customize any ENV VARs, when you start the Immich dev container, it will be configured to use volumes for the upload and database locations on disk. These volumes are persistent, and they last between container rebuilds and restarts.

In non-cloud environments, you can optionally use host filesystem paths instead of volumes - this will allow you to store the upload directory and database directory on the host filesystem, rather than a volume.

### Launching Dev Container from a cloned repo

1. Clone the project repo.
2. Open VS Code
3. Press ctrl/command-p type ">Dev Containers: Rebuild and Reopen in Container"
4. Select "Immich - Backend and Frontend"
5. Wait a while - after the builds are done, the server and web processes will be started as tasks, and the browser will be opened (once) to the front page.

## Configuring Database and Upload paths to the host

ENV VARs can use to control the location of the upload and the database paths.

### UPLOAD_LOCATION

The default for `UPLOAD_LOCATION` is `vol-upload` which is a volume mount.

The only supported value when using volumes is `vol-upload`. This is because it is hard-coded as a named volume in the `.devcontainer/server/docker-compose.yaml` file.

To use a bind mount instead, simply set `UPLOAD_LOCATION` to an **absolute** path on the host file system instead. This must be added to the `.bash_profile` if your using bash, or equivalent for other shells.

```bash
export UPLOAD_LOCATION=/data/my/upload/path
```

### DB_DATA_LOCATION

The default for `DB_DATA_LOCATION` is `vol-database` which is a volume mount.

The only supported value when using volumes is `vol-database` since it hard-coded as a named volume in the `.devcontainer/server/docker-compose.yaml` file.

To use a bind mount instead, simply set `DB_DATA_LOCATION` to an **absolute** path on the host file system instead. This must be added to the `.bash_profile` if your using bash, or equivalent for other shells.

```bash
export DB_DATA_LOCATION=/data/my/upload/path
```

### Other Variables

Its unlikely, but in case you modified the username/password of the database, you can control these values using the following ENV VARs:

```bash
export DB_PASSWORD=postgres
export DB_USERNAME=postgres
export DB_DATABASE_NAME=immich
```

This must be added to the `.bash_profile` if your using bash, or equivalent for other shells.
