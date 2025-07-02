# Build and Deploy Guide - Multi-Face Search Feature

This guide will help you build and deploy Immich with the new multi-face search feature.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned locally
- Sufficient disk space for Docker images (~4-6GB)

## Quick Start

### 1. Build the Docker Images

```bash
# Navigate to the Immich directory
cd /path/to/immich

# Build the server image with multi-face search feature
docker build -t immich-server:multi-face -f server/Dockerfile .

# Build the machine learning image
docker build -t immich-machine-learning:latest -f machine-learning/Dockerfile machine-learning/

# Build the web interface
docker build -t immich-web:latest -f web/Dockerfile web/
```

### 2. Use Docker Compose (Recommended)

Create a custom docker-compose file:

```bash
# Copy the production compose file
cp docker/docker-compose.prod.yml docker-compose-multi-face.yml

# Edit the compose file to use our custom images
# (See the docker-compose-multi-face.yml file created below)
```

### 3. Deploy

```bash
# Start the services
docker-compose -f docker-compose-multi-face.yml up -d

# Check logs
docker-compose -f docker-compose-multi-face.yml logs -f immich-server
```

## Detailed Instructions

### Environment Setup

1. **Create .env file:**

```bash
cp docker/example.env docker/.env
```

2. **Edit docker/.env with your settings:**

```env
# Database
DB_PASSWORD=postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich

# Upload Location (change to your desired path)
UPLOAD_LOCATION=/path/to/your/photos

# Redis
REDIS_HOSTNAME=redis

# Optional: Machine Learning
MACHINE_LEARNING_ENABLED=true
```

### Build Commands

#### Production Build

```bash
# Full production build
docker build --target production -t immich-server:multi-face -f server/Dockerfile .
docker build -t immich-machine-learning:latest machine-learning/
```

#### Development Build

```bash
# Development build with hot-reload
docker build --target dev -t immich-server-dev:multi-face -f server/Dockerfile .
docker build -t immich-web-dev:latest web/
docker build -t immich-machine-learning-dev:latest machine-learning/
```

### Using Make Commands

If you have Node.js installed locally:

```bash
# Install dependencies
make setup-dev

# Build all components
make build-all

# Run development environment
make dev

# Run production environment
make prod
```

### Manual Docker Compose

You can also run the services manually:

```bash
# Start database and Redis
docker run -d --name immich_postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=immich \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0

docker run -d --name immich_redis \
  -p 6379:6379 \
  docker.io/valkey/valkey:8-bookworm

# Start Immich server with multi-face feature
docker run -d --name immich_server \
  -p 2283:2283 \
  -v /path/to/photos:/usr/src/app/upload \
  --link immich_postgres:database \
  --link immich_redis:redis \
  -e DB_PASSWORD=postgres \
  -e DB_USERNAME=postgres \
  -e DB_DATABASE_NAME=immich \
  -e REDIS_HOSTNAME=redis \
  immich-server:multi-face

# Start machine learning service
docker run -d --name immich_machine_learning \
  -p 3003:3003 \
  -v model_cache:/cache \
  immich-machine-learning:latest
```

## Troubleshooting

### Common Issues

1. **Docker Sign-in Required:**

   ```bash
   # Switch to default context
   docker context use default

   # Or use legacy builder
   DOCKER_BUILDKIT=0 docker build -t immich-server:multi-face -f server/Dockerfile .
   ```

2. **Build Fails - Node.js Dependencies:**

   ```bash
   # Clear Docker cache
   docker builder prune -af

   # Build with no cache
   docker build --no-cache -t immich-server:multi-face -f server/Dockerfile .
   ```

3. **Permission Issues:**

   ```bash
   # Fix upload directory permissions
   sudo chown -R $USER:$USER /path/to/photos
   chmod 755 /path/to/photos
   ```

4. **Database Connection Issues:**

   ```bash
   # Check if PostgreSQL is running
   docker logs immich_postgres

   # Restart database
   docker restart immich_postgres
   ```

### Verify the Multi-Face Feature

1. **Check Server Logs:**

   ```bash
   docker logs immich_server | grep -i "PersonSearchBehavior"
   ```

2. **Test API Endpoint:**

   ```bash
   curl -X POST http://localhost:2283/api/search/metadata \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "personIds": ["person1", "person2"],
       "personSearchBehavior": "only"
     }'
   ```

3. **Check Web Interface:**
   - Navigate to search page
   - Select multiple people
   - Verify the three-option toggle appears: "All People", "Any People", "Only Them"

## Feature Usage

### New Search Behaviors

1. **All People (AND)**: `personSearchBehavior: "and"`

   - Shows photos containing ALL selected people
   - Default behavior (backward compatible)

2. **Any People (OR)**: `personSearchBehavior: "or"`

   - Shows photos containing ANY of the selected people
   - Good for group events

3. **Only Them (ONLY)**: `personSearchBehavior: "only"`
   - Shows photos containing ONLY the selected people
   - No other people in the photos
   - Perfect for intimate moments

### API Examples

```typescript
// All people together
const searchAll = {
  personIds: ["mom-id", "dad-id"],
  personSearchBehavior: "and",
};

// Any family member
const searchAny = {
  personIds: ["mom-id", "dad-id", "kid-id"],
  personSearchBehavior: "or",
};

// Just the couple
const searchOnly = {
  personIds: ["wife-id", "husband-id"],
  personSearchBehavior: "only",
};
```

## Performance Notes

- **Database Impact**: The "only" behavior uses more complex queries but is optimized
- **Index Usage**: Leverages existing `asset_faces` table indexes
- **Memory**: No additional memory requirements for the feature
- **Startup**: No impact on application startup time

## Backup and Migration

Before deploying:

1. **Backup Database:**

   ```bash
   docker exec immich_postgres pg_dump -U postgres immich > immich_backup.sql
   ```

2. **Backup Photos:**

   ```bash
   rsync -av /path/to/photos/ /backup/location/
   ```

3. **Test Migration:**
   ```bash
   # Test with a copy of your data first
   cp -r /path/to/photos /tmp/test-photos
   # Use /tmp/test-photos as UPLOAD_LOCATION for testing
   ```

## Support

For issues with the multi-face search feature:

1. Check the logs: `docker logs immich_server`
2. Verify API responses include `personSearchBehavior` field
3. Test with different combinations of people
4. Report issues with specific search scenarios

## Next Steps

After successful deployment:

1. **Update Translation Files**: Add translations for new UI text
2. **User Training**: Familiarize users with the three search modes
3. **Performance Monitoring**: Monitor database query performance
4. **Feature Feedback**: Collect user feedback for improvements
