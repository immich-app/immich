FROM node:22.13.1-alpine3.20@sha256:c52e20859a92b3eccbd3a36c5e1a90adc20617d8d421d65e8a622e87b5dac963

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
