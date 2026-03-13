#!/usr/bin/env bash
set -euo pipefail

# Ensure an Android emulator is running and fully booted.
# If one is already connected via adb, skips launching.
# Otherwise, starts the first available AVD headless and waits for boot.

ANDROID_SDK="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
ADB="$ANDROID_SDK/platform-tools/adb"
EMULATOR="$ANDROID_SDK/emulator/emulator"
AVDMANAGER="$ANDROID_SDK/cmdline-tools/latest/bin/avdmanager"

# AVD home may be non-default (e.g. ~/.config/.android/avd)
export ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-$(
  "$AVDMANAGER" list avd 2>/dev/null \
    | grep 'Path:' \
    | head -1 \
    | sed 's|.*Path: \(.*\)/[^/]*$|\1|'
)}"

# Check if an emulator is already connected
if "$ADB" devices 2>/dev/null | grep -q 'emulator-.*device$'; then
  echo "Emulator already running."
  exit 0
fi

# Find first available AVD
AVD=$("$EMULATOR" -list-avds 2>/dev/null | head -1)
if [ -z "$AVD" ]; then
  echo "ERROR: No AVDs found. Create one with:"
  echo "  avdmanager create avd -n test_device -k 'system-images;android-34;google_apis;x86_64' -d pixel_6"
  exit 1
fi

echo "Starting emulator '$AVD' (headless)..."
"$EMULATOR" -avd "$AVD" -no-window -no-audio -gpu swiftshader_indirect -no-snapshot-save &
EMULATOR_PID=$!
disown "$EMULATOR_PID"

echo "Waiting for emulator to boot..."
for i in $(seq 1 60); do
  if "$ADB" shell getprop sys.boot_completed 2>/dev/null | grep -q '1'; then
    echo "Emulator booted."
    # Dismiss the initial setup / unlock screen
    "$ADB" shell input keyevent 82 2>/dev/null || true
    exit 0
  fi
  echo "  Waiting... ($i/60)"
  sleep 2
done

echo "ERROR: Emulator failed to boot within 120 seconds"
kill "$EMULATOR_PID" 2>/dev/null || true
exit 1
