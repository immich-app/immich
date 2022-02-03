# IMMICH - Server

A self-hosted solution for mobile backup and viewing images/videos.

# Requesquisite

There is a tensorflow module running in the server so some package will be needed when building the Node's modules

```bash
$ apt-get install make cmake gcc g++
```

# Docker

To run application using docker compose

```bash
docker-compose up
```

To force rebuild node module after installing new packages

```bash
docker-compose up --build -V
```
