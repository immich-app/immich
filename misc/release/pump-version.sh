#!/usr/bin/env bash

#
# Pump one or both of the server/mobile versions in appropriate files.
#
# Usage:
#   ./misc/release/pump-version.sh [-s <major|minor|patch>] [-m <true|false>] [-r <true|false>]
#
# Flags:
#   -s <major|minor|patch>   Server version bump scope. Omit to leave the server
#                            version unchanged, except when finalizing an RC (see -r).
#                            (default: false)
#   -m <true|false>          Whether to increment the mobile build number.
#                            (default: false)
#   -r <true|false>          Release candidate mode. When true, starts a new RC
#                            (combined with -s) or iterates an existing one. When
#                            false while the current version is already an RC,
#                            finalizes it (e.g. 3.1.0-rc.2 => 3.1.0). A server bump
#                            is rejected while on an RC; finalize first.
#                            (default: false)
#
# Examples:
#   ./misc/release/pump-version.sh -s major                     # 1.0.0+50  => 2.0.0+50
#   ./misc/release/pump-version.sh -s minor -m true             # 1.0.0+50  => 1.1.0+51
#   ./misc/release/pump-version.sh -m true                      # 1.0.0+50  => 1.0.0+51
#   ./misc/release/pump-version.sh -s minor -m true -r true     # 3.0.0      => 3.1.0-rc.0 (start RC)
#   ./misc/release/pump-version.sh -m true -r true              # 3.1.0-rc.0 => 3.1.0-rc.1 (iterate RC)
#   ./misc/release/pump-version.sh -m true                      # 3.1.0-rc.1 => 3.1.0      (finalize RC)
#

SERVER_PUMP="false"
MOBILE_PUMP="false"
RC="false"

while getopts 's:m:r:' flag; do
  case "${flag}" in
  s) SERVER_PUMP=${OPTARG} ;;
  m) MOBILE_PUMP=${OPTARG} ;;
  r) RC=${OPTARG} ;;
  *)
    echo "Invalid args"
    exit 1
    ;;
  esac
done

if [[ "$RC" != "true" && "$RC" != "false" ]]; then
  echo "Expected <true|false> for the -r argument"
  exit 1
fi

CURRENT_SERVER=$(jq -r '.version' server/package.json)

if [[ "$CURRENT_SERVER" == *-rc.* ]]; then
  CURRENT_BASE="${CURRENT_SERVER%-rc.*}"
  CURRENT_RC_NUM="${CURRENT_SERVER##*-rc.}"
else
  CURRENT_BASE="$CURRENT_SERVER"
  CURRENT_RC_NUM=""
fi

# Validate RC/server-bump combinations against current version state
if [[ -n "$CURRENT_RC_NUM" ]]; then
  # Currently on an RC: -r true iterates, -r false finalizes. Either way, a server bump is invalid.
  if [[ "$SERVER_PUMP" != "false" ]]; then
    echo "Cannot bump server while on an RC ($CURRENT_SERVER); finalize first by re-running with -r false and no -s."
    exit 1
  fi
else
  # Not currently on an RC
  if [[ "$RC" == "true" && "$SERVER_PUMP" == "false" ]]; then
    echo "Starting an RC requires a server bump."
    exit 1
  fi
fi

if [[ "$SERVER_PUMP" != "major" && "$SERVER_PUMP" != "minor" && "$SERVER_PUMP" != "patch" && "$SERVER_PUMP" != "false" ]]; then
  echo 'Expected <major|minor|patch|false> for the server argument'
  exit 1
fi

NEXT_SERVER="$CURRENT_SERVER"
if [[ "$SERVER_PUMP" == "false" && "$RC" == "false" && -z "$CURRENT_RC_NUM" ]]; then
  echo 'Skipping Server Pump'
else
  npm version "$CURRENT_SERVER" --allow-same-version --no-git-tag-version || exit 1

  if [[ "$RC" == "true" && -n "$CURRENT_RC_NUM" ]]; then
    npm version prerelease --no-git-tag-version || exit 1
  elif [[ "$RC" == "true" ]]; then
    npm version "pre$SERVER_PUMP" --preid=rc --no-git-tag-version || exit 1
  elif [[ -n "$CURRENT_RC_NUM" ]]; then
    # rc=false while on an RC → finalize
    npm version "$CURRENT_BASE" --no-git-tag-version || exit 1
  else
    npm version "$SERVER_PUMP" --no-git-tag-version || exit 1
  fi

  NEXT_SERVER=$(jq -r '.version' package.json)
fi

CURRENT_MOBILE=$(grep "^version: .*+[0-9]\+$" mobile/pubspec.yaml | cut -d "+" -f2)
NEXT_MOBILE=$CURRENT_MOBILE
if [[ $MOBILE_PUMP == "true" ]]; then
  set $((NEXT_MOBILE++))
elif [[ $MOBILE_PUMP == "false" ]]; then
  echo 'Skipping Mobile Pump'
else
  echo "Fatal: MOBILE_PUMP value $MOBILE_PUMP is invalid"
  exit 1
fi

if [ "$CURRENT_SERVER" != "$NEXT_SERVER" ]; then
  echo "Pumping Server: $CURRENT_SERVER => $NEXT_SERVER"

  pnpm version "$NEXT_SERVER" --no-git-tag-version --prefix server
  pnpm version "$NEXT_SERVER" --no-git-tag-version --prefix packages/cli
  pnpm version "$NEXT_SERVER" --no-git-tag-version --prefix web
  pnpm version "$NEXT_SERVER" --no-git-tag-version --prefix e2e
  pnpm version "$NEXT_SERVER" --no-git-tag-version --prefix packages/sdk

  # copy version to open-api spec
  mise run //:open-api

  NEXT_PY="${NEXT_SERVER//-rc./rc}"
  uv version --directory machine-learning "$NEXT_PY"

  if [[ "$NEXT_SERVER" != *-rc.* ]]; then
    ./misc/release/archive-version.js "$NEXT_SERVER"
  fi
fi

if [ "$CURRENT_MOBILE" != "$NEXT_MOBILE" ]; then
  echo "Pumping Mobile: $CURRENT_MOBILE => $NEXT_MOBILE"
fi

sed -i "s/\"android\.injected\.version\.name\" => \"$CURRENT_SERVER\",/\"android\.injected\.version\.name\" => \"$NEXT_SERVER\",/" mobile/android/fastlane/Fastfile
sed -i "s/\"android\.injected\.version\.code\" => $CURRENT_MOBILE,/\"android\.injected\.version\.code\" => $NEXT_MOBILE,/" mobile/android/fastlane/Fastfile
sed -i "s/^version: $CURRENT_SERVER+$CURRENT_MOBILE$/version: $NEXT_SERVER+$NEXT_MOBILE/" mobile/pubspec.yaml
# iOS marketing version cannot contain a pre-release suffix; the plist always holds the base version.
IOS_NEXT="${NEXT_SERVER%-rc.*}"
perl -i -p0e "s/(<key>CFBundleShortVersionString<\/key>\s*<string>)$CURRENT_BASE(<\/string>)/\${1}$IOS_NEXT\${2}/s" mobile/ios/Runner/Info.plist


echo "IMMICH_VERSION=v$NEXT_SERVER" >>"$GITHUB_ENV"
