---
title: Devcontainers
sidebar_position: 3
---

# Development with Dev Containers

Dev Containers provide a consistent, reproducible development environment using Docker containers. With a single click, you can get started with an Immich development environment on Mac, Linux, Windows, or in the cloud using GitHub Codespaces.

[![Open in VSCode Containers](https://img.shields.io/static/v1?label=VSCode%20DevContainer&message=Immich&color=blue)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/immich-app/immich/)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/immich-app/immich/)

[Learn more about Dev Containers](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)

## Prerequisites

Before getting started, ensure you have:

- **Docker Desktop** (latest version)
  - [Mac](https://docs.docker.com/desktop/install/mac-install/)
  - [Windows](https://docs.docker.com/desktop/install/windows-install/) (with WSL2 backend recommended)
  - [Linux](https://docs.docker.com/desktop/install/linux-install/)
- **Visual Studio Code** with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- **Git** for cloning the repository
- At least **8GB of RAM** (16GB recommended)
- **20GB of free disk space**

:::tip Alternative Development Environments
While this guide focuses on VS Code, you have many options for Dev Container development:

**Local Editors:**

- [IntelliJ IDEA](https://www.jetbrains.com/help/idea/connect-to-devcontainer.html) - Full JetBrains IDE support
- [neovim](https://github.com/jamestthompson3/nvim-remote-containers) - Lightweight terminal-based editor
- [Emacs](https://github.com/emacs-lsp/lsp-docker) - Extensible text editor
- [DevContainer CLI](https://github.com/devcontainers/cli) - Command-line interface

**Cloud-Based Solutions:**

- [GitHub Codespaces](https://github.com/features/codespaces) - Fully integrated with GitHub, excellent devcontainer.json support
- [GitPod](https://www.gitpod.io) - SaaS platform with recent Dev Container support (historically used gitpod.yml)

**Self-Hostable Options:**

- [Coder](https://coder.com) - Enterprise-focused, requires Terraform knowledge, self-managed
- [DevPod](https://devpod.sh) - Client-only tool with excellent devcontainer.json support, works with any provider (local, cloud, or on-premise)
  :::

## Dev Container Services

The Dev Container environment consists of the following services:

| Service          | Container Name            | Description                                               | Ports                                                                   |
| ---------------- | ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Server & Web     | `immich-server`           | Runs both API server and web frontend in development mode | 2283 (API)<br/>3000 (Web)<br/>9230 (Workers Debug)<br/>9231 (API Debug) |
| Database         | `database`                | PostgreSQL database                                       | 5432                                                                    |
| Cache            | `redis`                   | Valkey cache server                                       | 6379                                                                    |
| Machine Learning | `immich-machine-learning` | Immich ML model inference server                          | 3003                                                                    |

## Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/immich-app/immich.git
cd immich
```

### Step 2: Configure Environment Variables

The immich dev containers read environment variables from your shell environment, not from `.env` files. This allows them to work in cloud environments without pre-configuration.

:::important Required Configuration
When running locally, and if you want to create (or use an existing) DB and/or photo storage folder, you must set the `UPLOAD_LOCATION` variable in your shell environment before launching the Dev Container. This determines where uploaded files are stored and also where the DB stores it data.

```bash
# Set temporarily for current session
export UPLOAD_LOCATION=/opt/dev_upload_folder

# Or add to your shell profile for persistence
# (~/.bashrc, ~/.zshrc, ~/.bash_profile, etc.)
echo 'export UPLOAD_LOCATION=/opt/dev_upload_folder' >> ~/.bashrc
source ~/.bashrc
```

:::

### Step 3: Launch the Dev Container

#### Using VS Code UI:

1. Open the cloned repository in VS Code
2. Press `F1` or `Ctrl/Cmd+Shift+P` to open the command palette
3. Type and select "Dev Containers: Rebuild and Reopen in Container"
4. Select "Immich - Backend, Frontend and ML" from the list
5. Wait for the container to build and start (this may take several minutes on first run)

#### Using VS Code Quick Actions:

1. Open the repository in VS Code
2. You should see a popup asking if you want to reopen in a container
3. Click "Reopen in Container"

#### Using Command Line:

```bash
# Using the DevContainer CLI
devcontainer up --workspace-folder .
```

## Environment Variable Details

### How Dev Containers Handle Environment Variables

Unlike the Immich developer setup based on Docker Compose which uses `.env` files, Immich Dev Containers read environment variables from your shell environment. This is configured in `.devcontainer/devcontainer.json`:

```json
"remoteEnv": {
    "UPLOAD_LOCATION": "${localEnv:UPLOAD_LOCATION:./Library}",
    "DB_PASSWORD": "${localEnv:DB_PASSWORD:postgres}",
    "DB_USERNAME": "${localEnv:DB_USERNAME:postgres}",
    "DB_DATABASE_NAME": "${localEnv:DB_DATABASE_NAME:immich}"
}
```

The `${localEnv:VARIABLE:default}` syntax reads from your shell environment with optional defaults.

### Upload Location Path Resolution

The `UPLOAD_LOCATION` environment variable controls where files are stored:

**Default:** `./Library` (relative to the `docker` directory)
**Resolved to:** `<immich-root>/docker/Library`

**Bind Mounts Created:**

```yaml
# From .devcontainer/server/container-compose-overrides.yml
- ${UPLOAD_LOCATION-./Library}/photos:/workspaces/immich/server/upload
- ${UPLOAD_LOCATION-./Library}/postgres:/var/lib/postgresql/data
```

### Database Configuration

These variables have sensible defaults (for development) but can be customized:

| Variable           | Default    | Description         |
| ------------------ | ---------- | ------------------- |
| `DB_PASSWORD`      | `postgres` | PostgreSQL password |
| `DB_USERNAME`      | `postgres` | PostgreSQL username |
| `DB_DATABASE_NAME` | `immich`   | Database name       |

### Setting Environment Variables

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, `~/.bash_profile`, etc.):

```bash
# Required
export UPLOAD_LOCATION=./Library  # or absolute path

# Optional (only if using non-default values)
export DB_PASSWORD=your_password
export DB_USERNAME=your_username
export DB_DATABASE_NAME=your_database
```

Remember to reload your shell configuration:

```bash
source ~/.bashrc  # or ~/.zshrc, etc.
```

## Git Configuration

### SSH Keys and Authentication

To use your SSH keys for GitHub access inside the Dev Container:

1. **Start SSH Agent** on your host machine:

   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_rsa  # or your key path
   ```

2. **VS Code automatically forwards your SSH agent** to the container

For detailed instructions, see the [VS Code guide on sharing Git credentials](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials).

### Commit Signing

To use your SSH key for commit signing, see the [GitHub guide on SSH commit signing](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key#telling-git-about-your-ssh-key).

## Development Workflow

### Automatic Setup

When the Dev Container starts, it automatically:

1. **Runs post-create script** (`container-server-post-create.sh`):

   - Adjusts file permissions for the `node` user
   - Installs dependencies: `npm install` in all packages
   - Builds TypeScript SDK: `npm run build` in `open-api/typescript-sdk`

2. **Starts development servers** via VS Code tasks:

   - `Immich API Server (Nest)` - API server with hot-reloading on port 2283
   - `Immich Web Server (Vite)` - Web frontend with hot-reloading on port 3000
   - Both servers watch for file changes and recompile automatically

3. **Configures port forwarding**:
   - Web UI: http://localhost:3000 (opens automatically)
   - API: http://localhost:2283
   - Debug ports: 9230 (workers), 9231 (API)

:::info
The Dev Container setup replaces the `make dev` command from the traditional setup. All services start automatically when you open the container.
:::

### Accessing Services

Once running, you can access:

| Service  | URL                   | Description                                                                                    |
| -------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| Web UI   | http://localhost:3000 | Main web interface                                                                             |
| API      | http://localhost:2283 | REST API endpoints (Not used directly, web UI will expose this over http://localhost:3000/api) |
| Database | localhost:5432        | PostgreSQL (username: `postgres`) (Not used directly)                                          |

### Connecting Mobile Apps

To connect the mobile app to your Dev Container:

1. Find your machine's IP address
2. In the mobile app, use: `http://YOUR_IP:3000/api`
3. Ensure your firewall allows connections on port 2283

### Making Code Changes

- **Server code** (`/server`): Changes trigger automatic restart
- **Web code** (`/web`): Changes trigger hot module replacement
- **Database migrations**: Run `npm run sync:sql` in the server directory
- **API changes**: Regenerate TypeScript SDK with `make open-api`

## Testing

### Running Tests

The Dev Container supports multiple ways to run tests:

#### Using Make Commands (Recommended)

```bash
# Run tests for specific components
make test-server         # Server unit tests
make test-web           # Web unit tests
make test-e2e           # End-to-end tests
make test-cli           # CLI tests

# Run all tests
make test-all           # Runs tests for all components

# Medium tests (integration tests)
make test-medium-dev    # End-to-end tests
```

#### Using NPM Directly

```bash
# Server tests
cd /workspaces/immich/server
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report

# Web tests
cd /workspaces/immich/web
npm test               # Run all tests
npm run test:watch     # Watch mode

# E2E tests
cd /workspaces/immich/e2e
npm run test           # Run API tests
npm run test:web       # Run web UI tests
```

### Code Quality Commands

```bash
# Linting
make lint-server        # Lint server code
make lint-web          # Lint web code
make lint-all          # Lint all components

# Formatting
make format-server      # Format server code
make format-web        # Format web code
make format-all        # Format all code

# Type checking
make check-server       # Type check server
make check-web         # Type check web
make check-all         # Check all components

# Complete hygiene check
make hygiene-all       # Runs lint, format, check, SQL sync, and audit
```

### Additional Make Commands

```bash
# Build commands
make build-server       # Build server
make build-web         # Build web app
make build-all         # Build everything

# API generation
make open-api          # Generate OpenAPI specs
make open-api-typescript # Generate TypeScript SDK
make open-api-dart     # Generate Dart SDK

# Database
make sql               # Sync database schema

# Dependencies
make install-server    # Install server dependencies
make install-web      # Install web dependencies
make install-all      # Install all dependencies
```

### Debugging

The Dev Container is pre-configured for debugging:

1. **API Server Debugging**:

   - Set breakpoints in VS Code
   - Press `F5` or use "Run and Debug" panel
   - Select "Attach to Server" configuration
   - Debug port: 9231

2. **Worker Debugging**:

   - Use "Attach to Workers" configuration
   - Debug port: 9230

3. **Web Debugging**:
   - Use browser DevTools
   - VS Code debugger for Chrome/Edge extensions supported

## Troubleshooting

### Common Issues

#### Permission Errors

**Problem**: `EACCES` or permission denied errors  
**Solution**:

- The Dev Container runs as the `node` user (UID 1000)
- If your host UID differs, you may see permission issues
- Try rebuilding the container: "Dev Containers: Rebuild Container"

#### Container Won't Start

**Problem**: Dev Container fails to start or build  
**Solution**:

1. Check Docker is running: `docker ps`
2. Clean Docker resources: `docker system prune -a`
3. Check available disk space
4. Review Docker Desktop resource limits

#### Port Already in Use

**Problem**: "Port 3000/2283 is already in use"  
**Solution**:

1. Check for conflicting services: `lsof -i :3000` (macOS/Linux)
2. Stop conflicting services or change port mappings
3. Restart Docker Desktop

#### Upload Location Not Set

**Problem**: Errors about missing UPLOAD_LOCATION  
**Solution**:

1. Set the environment variable: `export UPLOAD_LOCATION=./Library`
2. Add to your shell profile for persistence
3. Restart your terminal and VS Code

#### Database Connection Failed

**Problem**: Cannot connect to PostgreSQL  
**Solution**:

1. Ensure all containers are running: `docker ps`
2. Check logs: "Dev Containers: Show Container Log"
3. Verify database credentials match environment variables

### Getting Help

If you encounter issues:

1. Check container logs: View → Output → Select "Dev Containers"
2. Rebuild without cache: "Dev Containers: Rebuild Container Without Cache"
3. Review [common Docker issues](https://docs.docker.com/desktop/troubleshoot/)
4. Ask in [Discord](https://discord.immich.app) `#help-desk-support` channel

## Mobile Development

While the Dev Container focuses on server and web development, you can connect mobile apps for testing:

### Connecting iOS/Android Apps

1. **Ensure API is accessible**:

   ```bash
   # Find your machine's IP
   # macOS
   ipconfig getifaddr en0
   # Linux
   hostname -I
   # Windows (in WSL2)
   ip addr show eth0
   ```

2. **Configure mobile app**:

   - Server URL: `http://YOUR_IP:2283/api`
   - Ensure firewall allows port 2283

3. **For full mobile development**, see the [mobile development guide](/docs/setup#mobile-app) which covers:
   - Flutter setup
   - Running on simulators/devices
   - Mobile-specific debugging

## Advanced Configuration

### Custom VS Code Extensions

Add extensions to `.devcontainer/devcontainer.json`:

```json
"customizations": {
  "vscode": {
    "extensions": [
      "your.extension-id"
    ]
  }
}
```

### Additional Services

To add services (e.g., Redis Commander), modify:

1. `/docker/docker-compose.dev.yml` - Add service definition
2. `/.devcontainer/server/container-compose-overrides.yml` - Add overrides if needed

### Resource Limits

Adjust Docker Desktop resources:

- **macOS/Windows**: Docker Desktop → Settings → Resources
- **Linux**: Modify Docker daemon configuration

Recommended minimums:

- CPU: 4 cores
- Memory: 8GB
- Disk: 20GB

## Next Steps

- Read the [architecture overview](/docs/developer/architecture)
- Learn about [database migrations](/docs/developer/database-migrations)
- Explore [API documentation](https://immich.app/docs/api)
- Join `#immich` on [Discord](https://discord.immich.app)
