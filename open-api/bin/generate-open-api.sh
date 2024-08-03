#!/usr/bin/env bash
# usage: ./bin/generate-open-api.sh

OPENAPI_GENERATOR_VERSION=v7.5.0
BASE_URL=https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENERATOR_VERSION

PRE_PATCHES=(serialization/native/native_class.mustache api.mustache)
POST_PATCHES=(api_client.dart api.dart)
function cleanup {
  # Remove the patched files, so they don't show up as outgoing changes
  for patch in "${PRE_PATCHES[@]}"; do
    rm -vf "./templates/mobile/$patch"
  done
}
trap cleanup EXIT
function dart {
  rm -rf ../mobile/openapi
  for patch in "${PRE_PATCHES[@]}"; do
    url="$BASE_URL/modules/openapi-generator/src/main/resources/dart2/$patch"
    wget -O "./templates/mobile/$patch" "$url" 
    patch --no-backup-if-mismatch -u "./templates/mobile/$patch" <"./templates/mobile/$patch.patch"
  done
  
  npx --yes @openapitools/openapi-generator-cli generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t ./templates/mobile 

  # Post generate patches
  for patch in "${POST_PATCHES[@]}"; do
    patch --no-backup-if-mismatch -u "../mobile/openapi/lib/$patch" <"./patch/$patch.patch"
  done

  # Don't include analysis_options.yaml for the generated openapi files
  # so that language servers can properly exclude the mobile/openapi directory
  rm ../mobile/openapi/analysis_options.yaml
}

function typescript {
  npx --yes oazapfts --optimistic --argumentStyle=object --useEnumType immich-openapi-specs.json typescript-sdk/src/fetch-client.ts
  npm --prefix typescript-sdk ci && npm --prefix typescript-sdk run build
}

# requires server to be built
npm run sync:open-api --prefix=../server

if [[ $1 == 'dart' ]]; then
  dart
elif [[ $1 == 'typescript' ]]; then
  typescript
else
  dart
  typescript
fi

