FROM node:24.1.0-alpine3.20@sha256:8fe019e0d57dbdce5f5c27c0b63d2775cf34b00e3755a7dea969802d7e0c2b25
RUN corepack enable
ADD package.json *.ts ./
RUN pnpm install
EXPOSE 2286
CMD ["pnpm", "run", "start"]
