#!/usr/bin/env bash
set -euo pipefail

# Ensure patrol_cli is installed and up-to-date.
# Always runs `dart pub global activate patrol_cli` which is a no-op if already
# at the latest version, and upgrades otherwise.

echo "Ensuring patrol_cli is up-to-date..."
dart pub global activate patrol_cli
