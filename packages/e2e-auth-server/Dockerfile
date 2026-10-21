FROM node:24.22.1-trixie-slim@sha256:eb37f58646a901dc7727cf448cae36daaefaba79de33b5058dab79aa4c04aefb
WORKDIR /usr/src/app

RUN corepack enable

COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages/e2e-auth-server/package.json ./packages/e2e-auth-server/

WORKDIR /usr/src/app/packages/e2e-auth-server
RUN pnpm install --frozen-lockfile

COPY ./packages/e2e-auth-server ./

EXPOSE 2286
CMD ["pnpm", "run", "start"]
