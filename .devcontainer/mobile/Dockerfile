ARG BASEIMAGE=ghcr.io/immich-app/base-server-dev:202503182202@sha256:45ae044b64a7b518f8d94fa4de718090c1c7689d516ac2ac0976a5331eaeb396
FROM ${BASEIMAGE} AS dev

# Flutter SDK
# https://flutter.dev/docs/development/tools/sdk/releases?tab=linux
ENV FLUTTER_CHANNEL="stable"
ENV FLUTTER_VERSION="3.29.3"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

RUN apt-get install inetutils-ping sudo
RUN usermod -aG sudo node
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
RUN mkdir -p /workspaces/immich
RUN chown node -R /workspaces

# Flutter SDK
RUN mkdir -p ${FLUTTER_HOME} \
  && curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && rm flutter.tar.xz \
  && chown -R node ${FLUTTER_HOME}

USER node
RUN sudo apt-get update \
  && wget -qO- https://dcm.dev/pgp-key.public | sudo gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | sudo tee /etc/apt/sources.list.d/dart_stable.list \
  && sudo apt-get update \
  && sudo apt-get install dcm -y

RUN dart --disable-analytics