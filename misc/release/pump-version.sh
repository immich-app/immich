#!/usr/bin/env bash

#
# Pump one or both of the server/mobile versions in appropriate files
#
# usage: './scripts/pump-version.sh -s <minor|patch|premajor|preminor|prepatch|prerelease> <-m> <true|false>
#
# examples:
#    ./scripts/pump-version.sh -s major            # 1.0.0+50 => 2.0.0+50
#    ./scripts/pump-version.sh -s minor -m true    # 1.0.0+50 => 1.1.0+51
#    ./scripts/pump-version.sh -s premajor         # 1.0.0+50 => 2.0.0-rc.0+50
#    ./scripts/pump-version.sh -s prerelease       # 2.0.0-rc.0+50 => 2.0.0-rc.1+50
#    ./scripts/pump-version.sh -m true             # 1.0.0+50 => 1.0.0+51
#

SERVER_PUMP="false"
MOBILE_PUMP="false"

while getopts 's:m:' flag; do
  case "${flag}" in
  s) SERVER_PUMP=${OPTARG} ;;
  m) MOBILE_PUMP=${OPTARG} ;;
  *)
    echo "Invalid args"
    exit 1
    ;;
  esac
done

CURRENT_SERVER=$(jq -r '.version' package.json)
if ! NEXT_SERVER=$(pnpm --silent pump "$CURRENT_SERVER" "$SERVER_PUMP"); then
  echo "Fatal: failed to pump server version: $NEXT_SERVER" >&2
  exit 1
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

  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks
  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks --prefix server
  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks --prefix packages/cli
  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks --prefix web
  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks --prefix e2e
  pnpm version "$NEXT_SERVER" --no-git-tag-version --no-git-checks --prefix packages/sdk

  # copy version to open-api spec
  mise run //:open-api

  uv version --directory machine-learning "$NEXT_SERVER"

  ./misc/release/archive-version.js "$NEXT_SERVER"
fi

if [ "$CURRENT_MOBILE" != "$NEXT_MOBILE" ]; then
  echo "Pumping Mobile: $CURRENT_MOBILE => $NEXT_MOBILE"
fi

sed -i "s/\"android\.injected\.version\.name\" => \".*\",/\"android\.injected\.version\.name\" => \"$NEXT_SERVER\",/" mobile/android/fastlane/Fastfile
sed -i "s/\"android\.injected\.version\.code\" => [0-9]\+,/\"android\.injected\.version\.code\" => $NEXT_MOBILE,/" mobile/android/fastlane/Fastfile
sed -i "s/^version: .*+[0-9]\+$/version: $NEXT_SERVER+$NEXT_MOBILE/" mobile/pubspec.yaml
# strip prerelease from CFBundleShortVersionString (deploying to testflight _is_ the prerelease)
NEXT_SERVER_SHORT="${NEXT_SERVER%%-*}"
perl -i -p0e "s/(<key>CFBundleShortVersionString<\/key>\s*<string>).*?(<\/string>)/\${1}$NEXT_SERVER_SHORT\${2}/s" mobile/ios/Runner/Info.plist


echo "IMMICH_VERSION=v$NEXT_SERVER" >>"$GITHUB_ENV"
