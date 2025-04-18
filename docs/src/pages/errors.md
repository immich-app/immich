# Errors

## TypeORM Upgrade

The upgrade to Immich `v2.x.x` has a required upgrade path to `v1.132.0+`. This means it is required to start up the application at least once on version `1.132.0` (or later). Doing so will complete database schema upgrades that are required for `v2.0.0`. After Immich has successfully booted on this version, shut the system down and try the `v2.x.x` upgrade again.
