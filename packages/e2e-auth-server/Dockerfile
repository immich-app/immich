FROM node:24.19.0-trixie-slim@sha256:0711b541c1c33a8a530ac4f0d391baa9a15b3d804695b1b24a47daa5fb60e74d
WORKDIR /usr/src/app
COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages ./packages/
WORKDIR /usr/src/app/packages/e2e-auth-server
RUN corepack enable
RUN pnpm install --frozen-lockfile
EXPOSE 2286
CMD ["pnpm", "run", "start"]
