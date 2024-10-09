# System Integrity

## Folder checks

:::info
The folders considered for these checks include: `upload/`, `library/`, `thumbs/`, `encoded-video/`, `profile/`
:::

When Immich starts, it performs a series of checks in order to validate that it can read and write files to the volume mounts used by the storage system. If it cannot perform all the required operations, it will fail to start. The checks include:

- Creating an initial hidden file (`.immich`) in each folder
- Reading a hidden file (`.immich`) in each folder
- Overwriting a hidden file (`.immich`) in each folder

The checks are designed to catch the following situations:

- Incorrect permissions (cannot read/write files)
- Missing volume mount (`.immich` files should exist, but are missing)

### Common issues

:::note
`.immich` files serve as markers and help keep track of volume mounts being used by Immich. Except for the situations listed below, they should never be manually created or deleted.
:::

#### Missing `.immich` files

```
Verifying system mount folder checks (enabled=true)
...
ENOENT: no such file or directory, open 'upload/encoded-video/.immich'
```

The above error messages show that the server has previously (successfully) written `.immich` files to each folder, but now does not detect them. This could be because any of the following:

- Permission error - unable to read the file, but it exists
- File does not exist - volume mount has changed and should be corrected
- File does not exist - user manually deleted it and should be manually re-created (`touch .immich`)
- File does not exist - user restored from a backup, but did not restore each folder (user should restore all folders or manually create `.immich` in any missing folders)

### Ignoring the checks

The checks are designed to catch common problems that we have seen users have in the past, but if you want to disable them you can set the following environment variable:

```
IMMICH_IGNORE_MOUNT_CHECK_ERRORS=true
```
