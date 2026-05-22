.PHONY: setup build watch create_app_icon create_splash build_release_android pigeon test analyze format migration translation run clean

# --- 1. THE "CIO" ONE-TOUCH SETUP ---
# Use this for a fresh environment sync
setup:
	flutter pub get
	cd openapi && flutter pub get && dart run build_runner build --delete-conflicting-outputs
	$(MAKE) build

# --- 2. CORE BUILD LOGIC ---
build:
	dart run build_runner build --delete-conflicting-outputs
# Keep this until auto_route is patched
	dart format lib/routing/router.gr.dart

watch:
	dart run build_runner watch --delete-conflicting-outputs

# --- 3. PLATFORM & ASSETS ---
pigeon:
	dart run pigeon --input pigeon/native_sync_api.dart
	dart run pigeon --input pigeon/local_image_api.dart
	dart run pigeon --input pigeon/remote_image_api.dart
	dart run pigeon --input pigeon/background_worker_api.dart
	dart run pigeon --input pigeon/background_worker_lock_api.dart
	dart run pigeon --input pigeon/connectivity_api.dart
	dart run pigeon --input pigeon/network_api.dart
	dart format lib/platform/*.g.dart

create_app_icon:
	dart run flutter_launcher_icons

create_splash:
	dart run flutter_native_splash:create

# --- 4. DATA & LOCALIZATION ---
migration:
	dart run drift_dev make-migrations

translation:
	pnpm --prefix ../i18n run format:fix
	dart run easy_localization:generate -S ../i18n
	dart run bin/generate_keys.dart
	dart format lib/generated/*.g.dart

# --- 5. QUALITY CONTROL ---
analyze:
	dart analyze --fatal-infos
	dcm analyze lib --fatal-style --fatal-warnings

format:
	dart format --set-exit-if-changed $$(find lib -name '*.dart' -not \( -name 'generated_plugin_registrant.dart' -o -name '*.g.dart' -o -name '*.drift.dart' \))

test:
	flutter test

# --- 6. EXECUTION ---
run:
	flutter run

clean:
	flutter clean
	cd openapi && flutter clean
	flutter pub get