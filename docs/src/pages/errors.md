# Errors

## TypeORM Upgrade

If you encountered "Migrations failed: Error: Invalid upgrade path" then perform an intermediate upgrade to `v1.132.3` first.

:::tip
We recommend users upgrade to `v1.132.3` since it does not have any breaking changes or bugs on this upgrade path.
:::

In order to update to Immich `v1.137.0` or above, the application must be started at least once on a version in the range between `1.132.0` and `1.136.0`. Doing so will complete database schema upgrades that are required for `v1.137.0` (and above). After Immich has successfully updated to a version in this range, you can now attempt to update to `v1.137.0` (or above).

:::caution
Avoid `v1.136.0` if upgrading from `v1.131.0` (or earlier) due to a bug blocking this upgrade in some installations.
:::

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
