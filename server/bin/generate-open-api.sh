#!/bin/bash

function mobile {
  rm -rf ../mobile/openapi
  cd ./openapi-generator/templates/serialization/native
  wget -O native_class.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/dart2/serialization/native/native_class.mustache
  patch -u native_class.mustache <native_class.mustache.patch
  cd ../../../..
  npx openapi-generator-cli generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t ./openapi-generator/templates
}

function web {
  rm -rf ../web/src/api/open-api
  npx openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ../web/src/api/open-api
}

if [[ $1 == 'mobile' ]]; then
  mobile
elif [[ $1 == 'web' ]]; then
  web
else
  mobile
  web
fi
