---
sidebar_position: 4
---

# Technology stack

The app is built with the following technologies

## Frontend
* [Flutter](https://flutter.dev/) for the mobile app
  * [Riverpod](https://riverpod.dev/) as state management.
* [SvelteKit](https://kit.svelte.dev/) for the Web.

## Backend
* [Nest.js](https://nestjs.com/) for the server.
  * [TypeORM](https://typeorm.io/) for database management.
* [PostgreSQL](https://www.postgresql.org/) for the database.
* [Redis](https://redis.io/) for communication between the core server and the microservices.
* [NGINX](https://www.nginx.com/) for internal communication between containers and load balancing when scaling.

# App architecture

![Immich Architecture](./img/app-architecture.png)