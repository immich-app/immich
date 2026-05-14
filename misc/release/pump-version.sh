#!/usr/bin/env bash

#
# Pump one or both of the server/mobile versions in appropriate files
#
# usage: './scripts/pump-version.sh -s <major|minor|patch> <-m> <true|false> <-r> <true|false|finalize>
#
# examples:
#    ./scripts/pump-version.sh -s major         # 1.0.0+50 => 2.0.0+50
#    ./scripts/pump-version.sh -s minor -m true # 1.0.0+50 => 1.1.0+51
#    ./scripts/pump-version.sh -m true          # 1.0.0+50 => 1.0.0+51
#    ./scripts/pump-version.sh -s minor -m true -r true     # 3.0.0 => 3.1.0-rc.1 (start RC)
#    ./scripts/pump-version.sh -m true -r true              # 3.1.0-rc.1 => 3.1.0-rc.2 (iterate RC)
#    ./scripts/pump-version.sh -m true -r finalize          # 3.1.0-rc.2 => 3.1.0 (finalize RC)
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

if [[ "$RC" != "true" && "$RC" != "false" && "$RC" != "finalize" ]]; then
  echo "Expected <true|false|finalize> for the -r argument"
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
  # Currently on an RC
  if [[ "$RC" == "false" ]]; then
    echo "Current version $CURRENT_SERVER is a release candidate. Pass -r true to iterate the RC or -r finalize to finalize the release."
    exit 1
  fi
  if [[ "$RC" == "true" && "$SERVER_PUMP" != "false" ]]; then
    echo "Cannot start a new RC while still on an RC; finalize first."
    exit 1
  fi
  if [[ "$RC" == "finalize" && "$SERVER_PUMP" != "false" ]]; then
    echo "Finalize takes no server bump."
    exit 1
  fi
else
  # Not currently on an RC
  if [[ "$RC" == "true" && "$SERVER_PUMP" == "false" ]]; then
    echo "Starting an RC requires a server bump."
    exit 1
  fi
  if [[ "$RC" == "finalize" ]]; then
    echo "Nothing to finalize."
    exit 1
  fi
fi

MAJOR=$(echo "$CURRENT_BASE" | cut -d '.' -f1)
MINOR=$(echo "$CURRENT_BASE" | cut -d '.' -f2)
PATCH=$(echo "$CURRENT_BASE" | cut -d '.' -f3)

if [[ $SERVER_PUMP == "major" ]]; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
  PATCH=0
elif [[ $SERVER_PUMP == "minor" ]]; then
  MINOR=$((MINOR + 1))
  PATCH=0
elif [[ $SERVER_PUMP == "patch" ]]; then
  PATCH=$((PATCH + 1))
elif [[ $SERVER_PUMP == "false" ]]; then
  echo 'Skipping Server Pump'
else
  echo 'Expected <major|minor|patch|false> for the server argument'
  exit 1
fi

NEXT_BASE=$MAJOR.$MINOR.$PATCH

if [[ "$RC" == "true" ]]; then
  if [[ -n "$CURRENT_RC_NUM" ]]; then
    # Iterate existing RC
    NEXT_RC_NUM=$((CURRENT_RC_NUM + 1))
    NEXT_SERVER="${NEXT_BASE}-rc.${NEXT_RC_NUM}"
  else
    # Start new RC after server bump
    NEXT_SERVER="${NEXT_BASE}-rc.1"
  fi
elif [[ "$RC" == "finalize" ]]; then
  NEXT_SERVER="$NEXT_BASE"
else
  NEXT_SERVER="$NEXT_BASE"
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

  pnpm version "$NEXT_SERVER" --no-git-tag-version
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
