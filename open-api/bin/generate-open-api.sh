#!/usr/bin/env bash
OPENAPI_GENERATOR_VERSION=v6.6.0

# usage: ./bin/generate-open-api.sh

function dart {
  rm -rf ../mobile/openapi
  cd ./templates/mobile/serialization/native
  wget -O native_class.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENERATOR_VERSION/modules/openapi-generator/src/main/resources/dart2/serialization/native/native_class.mustache
  patch -u native_class.mustache <native_class.mustache.patch
  cd ../../../..
  npx --yes @openapitools/openapi-generator-cli generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t ./templates/mobile

  # Post generate patches
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api_client.dart <./patch/api_client.dart.patch
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api.dart <./patch/api.dart.patch
  sed -i 's/0.17.0/0.18.0/g' ../mobile/openapi/pubspec.yaml
}

function typescript {
  rm -rf ./typescript-sdk/client
  cd ./templates/typescript
  wget -O apiInner.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENERATOR_VERSION/modules/openapi-generator/src/main/resources/typescript-axios/apiInner.mustache
  patch -u apiInner.mustache < apiInner.mustache.patch
  cd ../..
  npx --yes @openapitools/openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ./typescript-sdk/client -t ./templates/typescript --additional-properties=useSingleRequestParameter=true
  npm --prefix typescript-sdk ci && npm --prefix typescript-sdk run build
}

node ./bin/sync-spec-version.js

if [[ $1 == 'dart' ]]; then
  dart
elif [[ $1 == 'typescript' ]]; then
  typescript
else
  dart
  typescript
fi
