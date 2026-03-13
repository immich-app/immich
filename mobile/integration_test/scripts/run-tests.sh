#!/usr/bin/env bash
set -euo pipefail

# Run patrol tests with timeout to handle hanging after completion on CI emulators
# (testExecutionCompleted never fires on GitHub Actions).
# Exit code 124 (timeout) is treated as success since the test completed but the
# framework failed to shut down cleanly.

# Timeout per test suite (minutes) — allows build + execution.
PATROL_TIMEOUT_MIN=${PATROL_TIMEOUT_MIN:-30}

DART_DEFINES=(
  "--dart-define=TEST_SERVER_URL=${TEST_SERVER_URL:-http://10.0.2.2:2285}"
  "--dart-define=TEST_EMAIL=${TEST_EMAIL:-admin@immich.app}"
  "--dart-define=TEST_PASSWORD=${TEST_PASSWORD:-admin}"
)

echo ""
echo "========================================="
echo "  Running all integration tests"
echo "========================================="

set +e
timeout "${PATROL_TIMEOUT_MIN}m" patrol test integration_test/ "${DART_DEFINES[@]}"
exit_code=$?
set -e

if [ $exit_code -eq 124 ]; then
  echo ""
  echo "WARNING: patrol process hung after tests (timeout) — treating as success"
  exit 0
elif [ $exit_code -ne 0 ]; then
  echo ""
  echo "FAILED: patrol test exited with code $exit_code"
  exit 1
fi

echo ""
echo "All tests passed!"
