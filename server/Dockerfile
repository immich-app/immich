FROM ghcr.io/immich-app/base-server:main as builder

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional

FROM ghcr.io/immich-app/base-server:main

ENV NODE_ENV=production

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
COPY package.json package-lock.json ./
COPY start*.sh ./

RUN npm link && npm cache clean --force
VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
