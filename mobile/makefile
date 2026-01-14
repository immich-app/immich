.PHONY: build watch create_app_icon create_splash build_release_android pigeon test analyze format

build:
	dart run build_runner build --delete-conflicting-outputs
# Remove once auto_route updated to 10.1.0
	dart format lib/routing/router.gr.dart

pigeon:
	dart run pigeon --input pigeon/native_sync_api.dart
	dart run pigeon --input pigeon/thumbnail_api.dart
	dart run pigeon --input pigeon/background_worker_api.dart
	dart run pigeon --input pigeon/background_worker_lock_api.dart
	dart run pigeon --input pigeon/connectivity_api.dart
	dart format lib/platform/native_sync_api.g.dart
	dart format lib/platform/thumbnail_api.g.dart
	dart format lib/platform/background_worker_api.g.dart
	dart format lib/platform/background_worker_lock_api.g.dart
	dart format lib/platform/connectivity_api.g.dart

watch:
	dart run build_runner watch --delete-conflicting-outputs

create_app_icon:
	flutter pub run flutter_launcher_icons:main

create_splash:
	flutter pub run flutter_native_splash:create

build_release_android:
	flutter build appbundle

migration:
	dart run drift_dev make-migrations

translation:
	npm --prefix ../i18n run format:fix
	dart run easy_localization:generate -S ../i18n
	dart run bin/generate_keys.dart
	dart format lib/generated/codegen_loader.g.dart
	dart format lib/generated/intl_keys.g.dart

analyze:
	dart analyze --fatal-infos
	dcm analyze lib --fatal-style --fatal-warnings

format:
# Ignore generated files manually until https://github.com/dart-lang/dart_style/issues/864 is resolved
	dart format --set-exit-if-changed $$(find lib -name '*.dart' -not \( -name 'generated_plugin_registrant.dart' -o -name '*.g.dart' -o -name '*.drift.dart' \))

test:
	flutter test
