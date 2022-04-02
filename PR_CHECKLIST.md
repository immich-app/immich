# Deployment checklist for iOS/Android/Server

[ ] Up version in [mobile/pubspec.yml](/mobile/pubspec.yaml)

[ ] Up version in [docker/docker-compose.yml](/docker/docker-compose.yml) for `immich_server` service

[ ] Up version in [docker/docker-compose.gpu.yml](/docker/docker-compose.gpu.yml) for `immich_server` service

[ ] Up version in [docker/docker-compose.dev.yml](/docker/docker-compose.gpu.yml) for `immich_server` service

[ ] Up version in [server/src/constants/server_version.constant.ts](/server/src/constants/server_version.constant.ts)

[ ] Up version in iOS Fastlane [/mobile/ios/fastlane/Fastfile](/mobile/ios/fastlane/Fastfile)

[ ] Add changelog to [Android Fastlane F-droid folder](/mobile/android/fastlane/metadata/android/en-US/changelogs)

All of the version should be the same.