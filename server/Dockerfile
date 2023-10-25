FROM immich-base-image:dev as base

COPY package.json package-lock.json ./
RUN npm ci

FROM immich-base-image:runtime as dev

COPY --from=base /usr/src/app/node_modules ./node_modules
COPY . .

FROM dev as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional

FROM immich-base-image:runtime

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
