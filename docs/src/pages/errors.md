# Errors

## TypeORM Upgrade

In order to update to Immich to `v1.137.0` (or above), the application must be started at least once on a version in the range between `1.132.0` and `1.136.0`. Doing so will complete database schema upgrades that are required for `v1.137.0` (and above). After Immich has successfully updated to a version in this range, you can now attempt to update to v1.137.0 (or above). We recommend users upgrade to `1.132.0` since it does not have any other breaking changes.

## Inconsistent Media Location

:::caution
This error is related to the location of media files _inside the container_. Never move files on the host system when you run into this error message.
:::

Immich automatically tries to detect where your Immich data is located. On start up, it compares the detected media location with the file paths in the database and throws an Inconsistent Media Location error when they do not match.

To fix this issue, verify that the `IMMICH_MEDIA_LOCATION` environment variable and `UPLOAD_LOCATION` volume mount are in sync with the database paths.

If you would like to migrate from one media location to another, simply successfully start Immich on `v1.136.0` or later, then do the following steps:

1. Stop Immich
2. Update `IMMICH_MEDIA_LOCATION` to the new location
3. Update the right-hand side of the `UPLOAD_LOCATION` volume mount to the new location
4. Start up Immich

After version `1.136.0`, Immich can detect when a media location has moved and will automatically update the database paths to keep them in sync.
