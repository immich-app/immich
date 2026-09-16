#!/usr/bin/env bash
# Reconciles the iOS project with the current Flutter setup
#
# `flutter build ios --config-only` is relatively expensive, so we attempt to avoid running it when possible

set -euo pipefail

stamp="build/ios_checkout.stamp"

# All tracked files that can invalidate the Xcode + Flutter build state
inputs_digest() {
  git ls-files -z ios pubspec.yaml pubspec.lock mise.toml mise.lock \
    | xargs -0 shasum \
    | shasum \
    | cut -d ' ' -f 1
}

# Echoes why the iOS project needs reconciling, or returns 1 if it does not.
# The first three cases can happen with no tracked file having changed at all,
# so comparing the digest alone is not enough.
staleness() {
  local flutter_root
  flutter_root="$(sed -n 's/^FLUTTER_ROOT=//p' ios/Flutter/Generated.xcconfig 2>/dev/null || true)"

  if [[ -z $flutter_root ]]; then
    echo "misconfigured FLUTTER_ROOT"
  elif [[ ! -d $flutter_root ]]; then
    echo "the Flutter SDK has changed"
  elif ! cmp -s ios/Podfile.lock ios/Pods/Manifest.lock; then
    # This is also done by Xcode's "Check Pods Manifest.lock" build phase
    echo "Cocoapods out of sync"
  elif [[ ! -f $stamp ]]; then
    echo "first checkout"
  elif [[ $(<"$stamp") != "$(inputs_digest)" ]]; then
    echo "tracked build state has changed"
  else
    return 1
  fi
}

[[ $(uname) == Darwin ]] || exit 0

if ! reason="$(staleness)"; then
  exit 0
fi

echo "Reconciling iOS project: $reason"
flutter build ios --config-only --debug

# Save tracked files manifest
mkdir -p "$(dirname "$stamp")"
inputs_digest > "$stamp"
