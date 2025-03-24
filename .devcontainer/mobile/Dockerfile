ARG BASEIMAGE=ghcr.io/immich-app/base-server-dev:202503182202@sha256:45ae044b64a7b518f8d94fa4de718090c1c7689d516ac2ac0976a5331eaeb396
FROM ${BASEIMAGE} AS dev

# Flutter SDK
# https://flutter.dev/docs/development/tools/sdk/releases?tab=linux
ENV FLUTTER_CHANNEL="stable"
ENV FLUTTER_VERSION="3.29.1"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

# Flutter SDK
RUN mkdir -p ${FLUTTER_HOME} \
  && curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && rm flutter.tar.xz \
  && chown -R 1000:1000 ${FLUTTER_HOME}

RUN apt-get update \
  && wget -qO- https://dcm.dev/pgp-key.public | gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | tee /etc/apt/sources.list.d/dart_stable.list \
  && apt-get update \
  && apt-get install dcm

RUN apt-get install inetutils-ping sudo
RUN usermod -aG sudo sudo node
RUN dart --disable-analytics