#!/usr/bin/env bash
OPENAPI_GENEARTOR_VERSION=v6.6.0

function mobile {
  rm -rf ../mobile/openapi
  cd ./openapi-generator/templates/mobile/serialization/native
  wget -O native_class.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENEARTOR_VERSION/modules/openapi-generator/src/main/resources/dart2/serialization/native/native_class.mustache
  patch -u native_class.mustache <native_class.mustache.patch
  cd ../../../../..
  npx --yes @openapitools/openapi-generator-cli generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t ./openapi-generator/templates/mobile

  # Post generate patches
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api_client.dart <./openapi-generator/patch/api_client.dart.patch
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api.dart <./openapi-generator/patch/api.dart.patch
  sed -i 's/0.17.0/0.18.0/g' ../mobile/openapi/pubspec.yaml
}

function web {
  rm -rf ../web/src/api/open-api
  cd ./openapi-generator/templates/web
  wget -O apiInner.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENEARTOR_VERSION/modules/openapi-generator/src/main/resources/typescript-axios/apiInner.mustache
  patch -u apiInner.mustache < apiInner.mustache.patch
  cd ../../..
  npx --yes @openapitools/openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ../web/src/api/open-api -t ./openapi-generator/templates/web --additional-properties=useSingleRequestParameter=true
}

function cli {
  rm -rf ../cli/src/api/open-api
  cd ./openapi-generator/templates/cli
  wget -O apiInner.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/$OPENAPI_GENEARTOR_VERSION/modules/openapi-generator/src/main/resources/typescript-axios/apiInner.mustache
  patch -u apiInner.mustache < apiInner.mustache.patch
  cd ../../..
  npx --yes @openapitools/openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ../cli/src/api/open-api -t ./openapi-generator/templates/cli --additional-properties=useSingleRequestParameter=true
}

if [[ $1 == 'mobile' ]]; then
  mobile
elif [[ $1 == 'web' ]]; then
  web
elif [[ $1 == 'cli' ]]; then
  cli
else
  mobile
  web
  cli
fi
