ARG BASEIMAGE=ghcr.io/immich-app/base-server-dev:202503182202@sha256:45ae044b64a7b518f8d94fa4de718090c1c7689d516ac2ac0976a5331eaeb396
FROM ${BASEIMAGE} AS dev

RUN apt-get install inetutils-ping sudo
RUN usermod -aG sudo node
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
RUN mkdir -p /workspaces/immich
RUN chown node -R /workspaces

COPY --chmod=777 ./.devcontainer/server/common.sh /workspaces/common.sh
COPY --chmod=777 ./.devcontainer/server/postCreate.sh /workspaces/postCreate.sh
COPY --chmod=777 ./.devcontainer/server/startServer.sh /workspaces/startServer.sh
COPY --chmod=777 ./.devcontainer/server/startWeb.sh /workspaces/startWeb.sh

COPY ./.devcontainer/ /workspaces/immich/.devcontainer/
# add postCreate here
# modify postCreate to search for which immich is active, and perform the changes needed
