#/bin/bash

#
# usage: './scripts/pump-version.sh <major|minor|patch> [:mobile]'
#
# examples:
#    ./scripts/pump-version.sh major
#    ./scripts/pump-version.sh minor mobile
#

CURRENT_SERVER=$(cat server/package.json | jq -r '.version')

MAJOR=$(echo $CURRENT_SERVER | cut -d '.' -f1)
MINOR=$(echo $CURRENT_SERVER | cut -d '.' -f2)
PATCH=$(echo $CURRENT_SERVER | cut -d '.' -f3)

if [[ $1 == "major" ]]; then
  $((MAJOR++))
elif [[ $1 == "minor" ]]; then
  $((MINOR++))
elif [[ $1 == "patch" ]]; then
  $((PATCH++))
else
  echo 'Expected <major|minor|patch>'
  exit 1
fi

NEXT_SERVER=$MAJOR.$MINOR.$PATCH

if [ "$CURRENT_SERVER" != "$NEXT_SERVER" ]; then
  # Bump Server

  echo "Pumping Server: $CURRENT_SERVER => $NEXT_SERVER"

  sed -i "s/^  \"version\": \"$CURRENT_SERVER\",$/  \"version\": \"$NEXT_SERVER\",/" server/package.json
  sed -i "s/^  \"version\": \"$CURRENT_SERVER\",$/  \"version\": \"$NEXT_SERVER\",/" server/package-lock.json
  sed -i "s/\"android\.injected\.version\.name\" => \"$CURRENT_SERVER\",/\"android\.injected\.version\.name\" => \"$NEXT_SERVER\",/" mobile/android/fastlane/Fastfile
fi


# Bump Mobile
CURRENT_MOBILE=$(cat mobile/pubspec.yaml | grep "^version: .*+[0-9]\+$" | cut -d "+" -f2)

if [ ! -z "$2" ]; then
  NEXT_MOBILE=$((CURRENT_MOBILE + 1))

  echo "Pumping Mobile: $CURRENT_MOBILE => $NEXT_MOBILE"

  sed -i "s/\"android\.injected\.version\.code\" => $CURRENT_MOBILE,/\"android\.injected\.version\.code\" => $NEXT_MOBILE,/" mobile/android/fastlane/Fastfile
  sed -i "s/^version: $CURRENT_SERVER+$CURRENT_MOBILE$/version: $NEXT_SERVER+$NEXT_MOBILE/" mobile/pubspec.yaml
fi
