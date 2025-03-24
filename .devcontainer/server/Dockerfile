ARG BASEIMAGE=ghcr.io/immich-app/base-server-dev:202503182202@sha256:45ae044b64a7b518f8d94fa4de718090c1c7689d516ac2ac0976a5331eaeb396
FROM ${BASEIMAGE} AS dev

RUN apt-get install inetutils-ping sudo
RUN usermod -aG sudo node
# RUN echo "node:pass" | chpasswd
# RUN echo "root:root" | chpasswd
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
