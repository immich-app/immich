# IMMICH

Self-hosted Photo backup solution directly from your mobile phone.

# Development

You can use docker compose for development, there are several services that compose Immich

1. The server
2. PostgreSQL
3. Redis

## Populate .env file

Navigate to `server` directory and run

```
cp .env.example .env
```

Then populate the value in there.

To start, run

```bash
docker-compose up ./server
```

To force rebuild node modules after installing new packages

```bash
docker-compose up --build -V ./server
```
