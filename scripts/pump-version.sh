#/bin/bash

#
# Pump one or both of the server/mobile versions in appropriate files
#
# usage: './scripts/pump-version.sh <major|minor|patch|fase> <mobile|false'>
#
# examples:
#    ./scripts/pump-version.sh major false        # 1.0.0+50 => 2.0.0+50 
#    ./scripts/pump-version.sh minor mobile       # 1.0.0+50 => 1.1.0+51
#    ./scripts/pump-version.sh false mobile       # 1.0.0+50 => 1.0.0+51
#

SERVER_PUMP=$1
MOBILE_PUMP=$2

CURRENT_SERVER=$(cat server/package.json | jq -r '.version')
MAJOR=$(echo $CURRENT_SERVER | cut -d '.' -f1)
MINOR=$(echo $CURRENT_SERVER | cut -d '.' -f2)
PATCH=$(echo $CURRENT_SERVER | cut -d '.' -f3)

if [[ $SERVER_PUMP == "major" ]]; then
  MAJOR=$((MAJOR + 1))
elif [[ $SERVER_PUMP == "minor" ]]; then
  MINOR=$((MINOR + 1))
elif [[ $1 == "patch" ]]; then
  PATCH=$((PATCH + 1))
elif [[ $SERVER_PUMP == "false" ]]; then
  echo 'Skipping Server Pump'
else
  echo 'Expected <major|minor|patch|false> for the first argument'
  exit 1
fi

NEXT_SERVER=$MAJOR.$MINOR.$PATCH

CURRENT_MOBILE=$(cat mobile/pubspec.yaml | grep "^version: .*+[0-9]\+$" | cut -d "+" -f2)
NEXT_MOBILE=$CURRENT_MOBILE
if [[ $MOBILE_PUMP == "mobile" ]]; then
  set $((NEXT_MOBILE++))
elif [[ $MOBILE_PUMP == "false" ]]; then
  echo 'Skipping Mobile Pump'
else
  echo 'Expected <mobile|false> for the second argument'
  exit 1
fi



if [ "$CURRENT_SERVER" != "$NEXT_SERVER" ]; then

  echo "Pumping Server: $CURRENT_SERVER => $NEXT_SERVER"

  sed -i "s/^  \"version\": \"$CURRENT_SERVER\",$/  \"version\": \"$NEXT_SERVER\",/" server/package.json
  sed -i "s/^  \"version\": \"$CURRENT_SERVER\",$/  \"version\": \"$NEXT_SERVER\",/" server/package-lock.json
  sed -i "s/\"android\.injected\.version\.name\" => \"$CURRENT_SERVER\",/\"android\.injected\.version\.name\" => \"$NEXT_SERVER\",/" mobile/android/fastlane/Fastfile
fi



if [ "$CURRENT_MOBILE" != "$NEXT_MOBILE" ]; then

  echo "Pumping Mobile: $CURRENT_MOBILE => $NEXT_MOBILE"

  sed -i "s/\"android\.injected\.version\.code\" => $CURRENT_MOBILE,/\"android\.injected\.version\.code\" => $NEXT_MOBILE,/" mobile/android/fastlane/Fastfile
  sed -i "s/^version: $CURRENT_SERVER+$CURRENT_MOBILE$/version: $NEXT_SERVER+$NEXT_MOBILE/" mobile/pubspec.yaml
fi
