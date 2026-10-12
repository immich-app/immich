#!/usr/bin/env bash
# Makes Flutter not incorrectly append `-sdk` arguments to simulator builds
# This breaks macros that must build for the host's platform
#
# Flutter was informed of this (https://github.com/flutter/flutter/issues/146122) but has not fixed it in 2 years

set -eu
sdk="${MISE_TOOL_INSTALL_PATH:-$(mise where aqua:flutter/flutter)}/flutter"
mac_dart="$sdk/packages/flutter_tools/lib/src/ios/mac.dart"

pattern="buildCommands.addAll(<String>['-sdk', XcodeSdk.IPhoneSimulator.platformName]);"

# Filter out the sdk arg pattern
if awk -v pat="$pattern" 'index($0, pat) { found=1; next } { print } END { exit !found }' "$mac_dart" > "$mac_dart.tmp"; then
  # If it was filtered out, apply it
  mv "$mac_dart.tmp" "$mac_dart"

  # Force flutter itself to rebuild
  rm -f "$sdk/bin/cache/flutter_tools.snapshot" "$sdk/bin/cache/flutter_tools.stamp"

  echo "flutter postinstall: removed simulator -sdk flag from xcodebuild invocation"
else
  rm -f "$mac_dart.tmp"
fi
