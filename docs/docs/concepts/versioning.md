# Versioning

Immich follows [semantic versioning](https://semver.org/), which tags releases in the format `<major>.<minor>.<patch>`. Breaking changes, including those to the API or to deployment, are intended to be limited to major version releases.

## Pinning a version

A Docker image can point at the current major version using a metatag, such as `:v3`. Metatags do not follow release candidates, so an instance pinned this way stays on stable releases within that major version.

## Client and server compatibility

The mobile app is typically compatible with the current and prior major version, but the server is only compatible with the matching major version. This asymmetry is why the recommended order is to upgrade all mobile clients **before** upgrading the server: a newer app can talk to the older server during the transition, while an older app cannot talk to a newer server.

## What is and is not supported

- Patches are not backported to earlier versions, so a fix is only available by moving to the most recent stable release.
- Downgrading to an earlier version is not supported, even within the same minor version. Database migrations run on upgrade and are not reversible, which is also why a [backup](/concepts/backups) before a major upgrade matters.

For the mechanics of upgrading, see [Upgrading](/install/upgrading).
