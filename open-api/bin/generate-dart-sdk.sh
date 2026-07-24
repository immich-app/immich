#!/usr/bin/env bash
OPENAPI_GENERATOR_VERSION=2.40.1

set -euo pipefail

# usage: ./bin/generate-dart-sdk.sh

TEMPLATE_DIR=$(mktemp -d)
trap 'rm -rf "$TEMPLATE_DIR"' EXIT

pnpm dlx --allow-build="" @openapitools/openapi-generator-cli@$OPENAPI_GENERATOR_VERSION author template -g dart -o "$TEMPLATE_DIR"
patch --no-backup-if-mismatch -u "$TEMPLATE_DIR/api.mustache" <./templates/mobile/api.mustache.patch
patch --no-backup-if-mismatch -u "$TEMPLATE_DIR/serialization/native/native_class.mustache" <./templates/mobile/serialization/native/native_class.mustache.patch

rm -rf ../mobile/openapi

pnpm dlx --allow-build="" @openapitools/openapi-generator-cli@$OPENAPI_GENERATOR_VERSION generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t "$TEMPLATE_DIR" --additional-properties=useOptional=true

# Post generate patches
patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api_client.dart <./patch/api_client.dart.patch
patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api.dart <./patch/api.dart.patch
patch --no-backup-if-mismatch -u ../mobile/openapi/pubspec.yaml <./patch/pubspec_immich_mobile.yaml.patch
patch --no-backup-if-mismatch -u ../mobile/openapi/lib/model/asset_edit_action_item_dto.dart <./patch/asset_edit_action_item_dto.dart.patch
# Don't include analysis_options.yaml for the generated openapi files
# so that language servers can properly exclude the mobile/openapi directory
rm ../mobile/openapi/analysis_options.yaml
