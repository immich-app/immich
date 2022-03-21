# Deployment checklist for iOS/Android/Server

[] Up version in [mobile/pubspec.yml](/mobile/pubspec.yaml)

[] Up version in [docker/docker-compose.yml](/docker/docker-compose.yml) for `immich_server` service

[] Up version in [docker/docker-compose.gpu.yml](/docker/docker-compose.gpu.yml) for `immich_server` service

[] Up version in [server/src/constants/server_version.constant.ts](/server/src/constants/server_version.constant.ts)

All of the version should be the same.