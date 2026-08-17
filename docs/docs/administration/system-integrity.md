# System Integrity

## Integrity report

At a [customizable interval](https://my.immich.app/admin/system-settings?isOpen=integrity-checks), Immich runs integrity checks to ensure that your library is still intact and there are no corrupt files.
There are three kind of issues Immich checks for:

- Untracked files: the path was found in Immich's directories but it is not referenced in Immich's database
- Missing files: the path is found in the Immich internal database, but does not actually exist on disk
- Checksum mismatches: the checksum of the file stored in Immich's database does not match the actual file's checksum anymore

All three run nightly at 3am by default. For the "Checksum files" check, there are additional time and progress limits, as those are the most taxing checks. With these additional limits, Immich can slowly check checksums of your files over the course of a couple of days.

You can see the results of these checks on the [maintenance](https://my.immich.app/admin/maintenance) page. Here, you can also trigger a full scan (a _check_) for specific jobs, or all of them. In addition, you can also _refresh_ checks. This will only look at items that have currently been reported on, and check if those have been fixed.

### Common causes

Most common are untracked files. In many cases those are corrupted thumbnails or encoded videos that have been partially generated at some point and never got cleaned up properly. These are usually fine to delete, as both can always be regenerated at a later point. Other files will need to be investigated on a case-by-case basis by checking they already exist in Immich and thinking about how they might have gotten untracked.

:::info
You might want to run the _missing_ jobs for thumbnails and encoded videos (https://my.immich.app/admin/queues) to make sure all your assets have proper thumbnails and encoded videos. Watch the server logs while running the jobs, in case there are any issues with some assets.
:::

Missing files are files where Immich references them internally, but they don't actually exist on disk in that location. It could be that you deleted a file on disk from the internal library (don't do that, Immich doesn't support it). It could also be that there are issues with your file storage. Please carefully investigate missing files, and never hesitate to reach out on [our Discord](https://discord.immich.app) if you have any questions!

Checksum mismatches are often indicative of file system corruption. It could also be that you previously edited a file from the internal library on the disk, which is also not supported and will cause a checksum mismatch. Again, the recommended action is to look at any reported item individually, check it out, try to remember if you changed it or some metadata on it at some point. If you edited the file, the supported resolution is to delete the mismatched asset from Immich and reupload it as a new asset.

## Folder checks

:::info
The folders considered for these checks include: `upload/`, `library/`, `thumbs/`, `encoded-video/`, `profile/`, `backups/`
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

:::danger
The checks are designed to catch common problems that we have seen users have in the past, and often indicate there's something wrong that you should solve. If you know what you're doing and you want to disable them you can set the following environment variable:
:::

```
IMMICH_IGNORE_MOUNT_CHECK_ERRORS=true
```
