ARG BASEIMAGE=ghcr.io/immich-app/base-server-dev:202503182202@sha256:45ae044b64a7b518f8d94fa4de718090c1c7689d516ac2ac0976a5331eaeb396
FROM ${BASEIMAGE} AS dev

RUN apt-get install inetutils-ping sudo -y
RUN usermod -aG sudo node
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
RUN mkdir -p /workspaces/immich
RUN chown node -R /workspaces

RUN mkdir /immich-devcontainer && chown node -R /immich-devcontainer
COPY --chmod=777 ./.devcontainer/server/common.sh /immich-devcontainer/common.sh
COPY --chmod=777 ./.devcontainer/server/postCreate.sh /immich-devcontainer/postCreate.sh
COPY --chmod=777 ./.devcontainer/server/startNestApiServer.sh /immich-devcontainer/startNestApiServer.sh
COPY --chmod=777 ./.devcontainer/server/startViteWebServer.sh /immich-devcontainer/startViteWebServer.sh


