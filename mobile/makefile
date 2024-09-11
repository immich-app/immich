.PHONY: build watch create_app_icon create_splash build_release_android

build:
	dart run build_runner build --delete-conflicting-outputs

watch:
	dart run build_runner watch --delete-conflicting-outputs

create_app_icon:
	flutter pub run flutter_launcher_icons:main

create_splash:
	flutter pub run flutter_native_splash:create

build_release_android:
	flutter build appbundle
