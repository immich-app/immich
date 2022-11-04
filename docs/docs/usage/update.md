---
sidebar_position: 4
---

# Update the application

If you are using Docker Compose, to update the application use the following commands in the directory where the `docker-compose.yml` file is located:

```bash title="Update Immich"
docker-compose pull && docker-compose up -d # Or `docker compose`
```