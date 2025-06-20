#!/bin/bash
# shellcheck source=common.sh
# shellcheck disable=SC1091
source /immich-devcontainer/container-common.sh

log "Setting up Immich dev container..."
fix_permissions

log "Installing npm dependencies (node_modules)..."
install_dependencies

log "Setup complete, please wait while backend and frontend services automatically start"
log
log "If necessary, the services may be manually started using"
log
log "$ /immich-devcontainer/container-start-backend.sh"
log "$ /immich-devcontainer/container-start-frontend.sh"
log
log "From different terminal windows, as these scripts automatically restart the server"
log "on error, and will continuously run in a loop"
