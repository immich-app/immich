# Slopich Demo Instance Setup

This directory contains the Docker Compose configuration for the Slopich demo instance that tracks the `main` branch.

## Prerequisites

- Linux VPS with Docker and Docker Compose installed
- SSH access configured for the deploy workflow
- At least 4GB RAM, 20GB disk space

## Initial Setup

The VPS runs all containers under a dedicated non-root `slopich` user.

1. **Create the user and directories (as root):**

```bash
useradd -m -s /bin/bash slopich
usermod -aG docker slopich
mkdir -p /opt/slopich/{postgres,library,snapshots}
chown -R slopich:slopich /opt/slopich
```

2. **Copy deployment files to `/opt/slopich/`:**

- `docker-compose.yml`
- `.env` (from `.env.example`)
- `deploy.sh`
- `snapshot-create.sh`
- `snapshot-restore.sh`

3. **Edit `.env`** — set `REPO_OWNER` to your GitHub org and change `DB_PASSWORD`.

4. **Log in to GHCR (as slopich user):**

```bash
su - slopich
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

5. **Start the stack:**

```bash
cd /opt/slopich
docker compose up -d
```

The instance will be available at `http://YOUR_VPS_IP:2283`.

## Snapshot Management

Snapshots save the Postgres database and the media library so the demo resets to a known state on every deploy.

### Creating a snapshot

After setting up the demo instance with the desired state (users, albums, photos):

```bash
ssh slopich@YOUR_VPS_IP
cd /opt/slopich
./snapshot-create.sh           # creates snapshot named "default"
./snapshot-create.sh my-snap   # or use a custom name
```

This stops the stack, copies `postgres/` and `library/` into `snapshots/<name>/`, then restarts.

### Restoring a snapshot manually

```bash
./snapshot-restore.sh           # restores "default"
./snapshot-restore.sh my-snap   # or a custom name
```

### Automatic restore on deploy

The `deploy.sh` script (called by CI) automatically restores the `default` snapshot before starting services. This means every merge to `main` resets the demo to your saved state with fresh images.

## GitHub Actions Secrets

Configure these repository secrets for automated deployment:

| Secret | Description |
|--------|-------------|
| `DEMO_SSH_HOST` | VPS hostname or IP address |
| `DEMO_SSH_USER` | `slopich` |
| `DEMO_SSH_KEY` | Private SSH key for authentication |

## How It Works

After every merge to `main`:
1. The `deploy-demo.yml` workflow builds fresh server and ML Docker images
2. Images are pushed to GHCR as `slopich-server:latest` and `slopich-machine-learning:latest`
3. The workflow SSHs into the VPS and runs `deploy.sh`, which:
   - Pulls the new images
   - Stops the running stack
   - Restores the DB and library from the `default` snapshot (if it exists)
   - Starts the stack with the new images
