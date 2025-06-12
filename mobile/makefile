.PHONY: build watch create_app_icon create_splash build_release_android pigeon

build:
	dart run build_runner build --delete-conflicting-outputs
# Remove once auto_route updated to 10.1.0
	dart format lib/routing/router.gr.dart

pigeon:
	dart run pigeon --input pigeon/native_sync_api.dart
	dart format lib/platform/native_sync_api.g.dart

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
	dart run easy_localization:generate -S ../i18n
	dart run bin/generate_keys.dart
	dart format lib/generated/codegen_loader.g.dart
	dart format lib/generated/intl_keys.g.dart