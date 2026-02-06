#!/usr/bin/env bash
set -euo pipefail

function dart {
  rm -rf ../mobile/openapi
  cd ./templates/mobile/serialization/native
  wget -O native_class.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/v7.12.0/modules/openapi-generator/src/main/resources/dart2/serialization/native/native_class.mustache
  patch --no-backup-if-mismatch -u native_class.mustache <native_class.mustache.patch
  patch --no-backup-if-mismatch -u native_class.mustache <native_class_nullable_items_in_arrays.patch

  cd ../../
  wget -O api.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/v7.12.0/modules/openapi-generator/src/main/resources/dart2/api.mustache
  patch --no-backup-if-mismatch -u api.mustache <api.mustache.patch

  cd ../../
  pnpm dlx @openapitools/openapi-generator-cli generate -g dart -i ./server-openapi-specs.json -o ../mobile/openapi -t ./templates/mobile

  # Post generate patches
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api_client.dart <./patch/api_client.dart.patch
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api.dart <./patch/api.dart.patch
  patch --no-backup-if-mismatch -u ../mobile/openapi/pubspec.yaml <./patch/pubspec_immich_mobile.yaml.patch
  rm -f ../mobile/openapi/analysis_options.yaml
}

function typescript {
  pnpm dlx oazapfts --optimistic --argumentStyle=object --useEnumType --allSchemas server-openapi-specs.json typescript-sdk/src/fetch-client.ts
  pnpm --filter @server/sdk install --frozen-lockfile
  pnpm --filter @server/sdk build
}

# Generate OpenAPI spec from server
(
  cd ..
  pnpm --filter immich build
  pnpm --filter immich sync:open-api
  cp server/server-openapi-specs.json open-api/server-openapi-specs.json
)

if [[ "${1:-}" == 'dart' ]]; then
  dart
elif [[ "${1:-}" == 'typescript' ]]; then
  typescript
else
  dart
  typescript
fi
