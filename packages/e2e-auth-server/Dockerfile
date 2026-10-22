FROM node:24.22.1-trixie-slim@sha256:fdc9220097e0ae3bd947c44b10cd3af5867a67a6d3a23b30b30b70929219034e
WORKDIR /usr/src/app

RUN corepack enable

COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages/e2e-auth-server/package.json ./packages/e2e-auth-server/

WORKDIR /usr/src/app/packages/e2e-auth-server
RUN pnpm install --frozen-lockfile

COPY ./packages/e2e-auth-server ./

EXPOSE 2286
CMD ["pnpm", "run", "start"]
