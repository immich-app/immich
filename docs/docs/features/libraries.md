# Libraries

## Overview

Immich supports the creation of libraries which is a top-level asset container. Currently, there are two types of libraries: traditional upload libraries that can sync with a mobile device, and external libraries, that keeps up to date with files on disk. Libraries are different from albums in that an asset can belong to multiple albums but only one library, and deleting a library deletes all assets contained within. As of August 2023, this is a new feature and libraries have a lot of potential for future development beyond what is documented here. This document attempts to describe the current state of libraries.

## The Upload Library

Immich comes preconfigured with an upload library for each user. All assets uploaded to Immich are added to this library. This library can be renamed, but not deleted. The upload library is the only library that can be synced with a mobile device. No items in an upload library is allowed to have the same sha1 hash as another item in the same library in order to prevent duplicates.

## External Libraries

External libraries tracks assets stored outside of Immich, i.e. in the file system. When the external library is scanned, Immich will read the metadata from the file and create an asset in the library for each image or video file. These items will then be shown in the main timeline, and they will look and behave like any other asset, including viewing on the map, adding to albums, etc.

If a file is modified outside of Immich, the changes will not be reflected in immich until the library is scanned again. There are different ways to scan a library depending on the use case:

- Scan Library Files: This is the default scan method and also the quickest. It will scan all files in the library and add new files to the library. It will notice if any files are missing (see below) but not check existing assets
- Scan All Library Files: Same as above, but will check each existing asset to see if the modification time has changed. If it has, the asset will be updated. Since it has to check each asset, this is slower than Scan Library Files.
- Force Scan All Library Files: Same as above, but will read each asset from disk no matter the modification time. This is useful in some cases where an asset has been modified externally but the modification time has not changed. This is the slowest way to scan because it reads each asset from disk.

:::caution

Due to aggressive caching it can take some time for a refreshed asset to appear correctly in the web view. You need to clear the cache in your browser to see the changes. This is a known issue and will be fixed in a future release. In Chrome, you need to open the developer console with F12, then reload the page with F5, and finally right click on the reload button and select "Empty Cache and Hard Reload".

:::

In external libraries, the file path is used for duplicate detection. This means that if a file is moved to a different location, it will be added as a new asset. If the file is moved back to its original location, it will be added as a new asset. In contrast to upload libraries, two identical files can be uploaded if they are in different locations. This is a deliberate design choice to make Immich reflect the file system as closely as possible. Remember that duplication detection is only done within the same library, so if you have multiple external libraries, the same file can be added to multiple libraries.

:::caution

If you add assets from an external library to an album and then move the asset to another location within the library, the asset will be removed from the album upon rescan. This is because the asset is considered a new asset after the move. This is a known issue and will be fixed in a future release.

:::

### Deleted External Assets

Note: Either a manual or scheduled library scan must have been performed to identify offline assets before this process will work.

In all above scan methods, Immich will check if any files are missing. This can happen if files are deleted, or if they are on a storage location that is currently unavailable, like a network drive that is not mounted, or a USB drive that has been unplugged. In order to prevent accidental deletion of assets, Immich will not immediately delete an asset from the library if the file is missing. Instead, the asset will be internally marked as offline and will still be visible in the main timeline. If the file is moved back to its original location and the library is scanned again, the asset will be restored.

Finally, files can be deleted from Immich via the `Remove Offline Files` job. This job can be found by the three dots menu for the associated external storage that was configured under Administration > Libraries (the same location described at [create external libraries](#create-external-libraries)). When this job is run, any assets marked as offline will then be removed from Immich. Run this job whenever files have been deleted from the file system and you want to remove them from Immich.

### Import Paths

External libraries use import paths to determine which files to scan. Each library can have multiple import paths so that files from different locations can be added to the same library. Import paths are scanned recursively, and if a file is in multiple import paths, it will only be added once. Each import file must be a readable directory that exists on the filesystem; the import path dialog will alert you of any paths that are not accessible.

If the import paths are edited in a way that an external file is no longer in any import path, it will be removed from the library in the same way a deleted file would. If the file is moved back to an import path, it will be added again as if it was a new file.

### Troubleshooting

Sometimes, an external library will not scan correctly. This can happen if immich_server or immich_microservices can't access the files. Here are some things to check:

- In the docker-compose file, are the volumes mounted correctly?
- Are the volumes identical between the `server` and `microservices` container?
- Are the import paths set correctly, and do they match the path set in docker-compose file?
- Make sure you don't use symlinks in your import libraries, and that you aren't linking across docker mounts.
- Are the permissions set correctly?
- Make sure you are using forward slashes (`/`) and not backward slashes.

To validate that Immich can reach your external library, start a shell inside the container. Run `docker exec -it immich_microservices /bin/bash` to a bash shell. If your import path is `/data/import/photos`, check it with `ls /data/import/photos`. Do the same check for the `immich_server` container. If you cannot access this directory in both the `microservices` and `server` containers, Immich won't be able to import files.

### Exclusion Patterns

By default, all files in the import paths will be added to the library. If there are files that should not be added, exclusion patterns can be used to exclude them. Exclusion patterns are glob patterns are matched against the full file path. If a file matches an exclusion pattern, it will not be added to the library. Exclusion patterns can be added in the Scan Settings page for each library. Under the hood, Immich uses the [glob](https://www.npmjs.com/package/glob) package to match patterns, so please refer to [their documentation](https://github.com/isaacs/node-glob#glob-primer) to see what patterns are supported.

Some basic examples:

- `**/*.tif` will exclude all files with the extension `.tif`
- `**/hidden.jpg` will exclude all files named `hidden.jpg`
- `**/Raw/**` will exclude all files in any directory named `Raw`
- `**/*.{tif,jpg}` will exclude all files with the extension `.tif` or `.jpg`

### Automatic watching (EXPERIMENTAL)

This feature - currently hidden in the config file - is considered experimental and for advanced users only. If enabled, it will allow automatic watching of the filesystem which means new assets are automatically imported to Immich without needing to rescan. Deleted assets are, as always, marked as offline and can be removed with the "Remove offline files" button.

If your photos are on a network drive, automatic file watching likely won't work. In that case, you will have to rely on a periodic library refresh to pull in your changes.

#### Troubleshooting

If you encounter an `ENOSPC` error, you need to increase your file watcher limit. In sysctl, this key is called `fs.inotify.max_user_watched` and has a default value of 8192. Increase this number to a suitable value greater than the number of files you will be watching. Note that Immich has to watch all files in your import paths including any ignored files.

```
ERROR [LibraryService] Library watcher for library c69faf55-f96d-4aa0-b83b-2d80cbc27d98 encountered error: Error: ENOSPC: System limit for number of file watchers reached, watch '/media/photo.jpg'
```

In rare cases, the library watcher can hang, preventing Immich from starting up. In this case, disable the library watcher in the configuration file. If the watcher is enabled from within Immich, the app must be started without the microservices. Disable the microservices in the docker compose file, start Immich, disable the library watcher in the admin settings, close Immich, re-enable the microservices, and then Immich can be started normally.

### Nightly job

There is an automatic job that's run once a day and refreshes all modified files in all libraries as well as cleans up any libraries stuck in deletion.

## Usage

Let's show a concrete example where we add an existing gallery to Immich. Here, we have the following folders we want to add:

- `/home/user/old-pics`: a folder containing childhood photos.
- `/mnt/nas/christmas-trip`: photos from a christmas trip. The subfolder `/mnt/nas/christmas-trip/Raw` contains the raw files directly from the DSLR. We don't want to import the raw files to Immich
- `/mnt/media/videos`: Videos from the same christmas trip.

First, we need to plan how we want to organize the libraries. The christmas trip photos should belong to its own library since we want to exclude the raw files. The videos and old photos can be in the same library since we want to import all files. We could also add all three folders to the same library if there are no files matching the Raw exclusion pattern in the other folders.

### Mount Docker Volumes

`immich-server` and `immich-microservices` containers will need access to the gallery. Modify your docker compose file as follows

```diff title="docker-compose.yml"
  immich-server:
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - /mnt/nas/christmas-trip:/mnt/media/christmas-trip:ro
+     - /home/user/old-pics:/mnt/media/old-pics:ro
+     - /mnt/media/videos:/mnt/media/videos:ro
+     - "C:/Users/user_name/Desktop/my media:/mnt/media/my-media:ro" # import path in Windows system.


  immich-microservices:
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
+     - /mnt/nas/christmas-trip:/mnt/media/christmas-trip:ro
+     - /home/user/old-pics:/mnt/media/old-pics:ro
+     - /mnt/media/videos:/mnt/media/videos:ro
+     - "C:/Users/user_name/Desktop/my media:/mnt/media/my-media:ro" # import path in Windows system.
```

:::tip
The `ro` flag at the end only gives read-only access to the volumes. While Immich does not modify files, it's a good practice to mount read-only.
:::

:::info
_Remember to bring the container `docker compose down/up` to register the changes. Make sure you can see the mounted path in the container._
:::

### Create External Libraries

These actions must be performed by the Immich administrator.

- Click on Administration -> Libraries
- Click on Create External Library
- Select which user owns the library, this can not be changed later
- Click the drop-down menu on the newly created library
- Click on Rename Library and rename it to "Christmas Trip"
- Click Edit Import Paths
- Click on Add Path
- Enter `/mnt/media/christmas-trip` then click Add

NOTE: We have to use the `/mnt/media/christmas-trip` path and not the `/mnt/nas/christmas-trip` path since all paths have to be what the Docker containers see.

Next, we'll add an exclusion pattern to filter out raw files.

- Click the drop-down menu on the newly-created Christmas library
- Click on Manage
- Click on Scan Settings
- Click on Add Exclusion Pattern
- Enter `**/Raw/**` and click save.
- Click save
- Click the drop-down menu on the newly created library
- Click on Scan Library Files

The christmas trip library will now be scanned in the background. In the meantime, let's add the videos and old photos to another library.

- Click on Create External Library.

:::note
If you get an error here, please rename the other external library to something else. This is a bug that will be fixed in a future release.
:::

- Click the drop-down menu on the newly created library
- Click Edit Import Paths
- Click on Add Path
- Enter `/mnt/media/old-pics` then click Add
- Click on Add Path
- Enter `/mnt/media/videos` then click Add
- Click Save
- Click on Scan Library Files

Within seconds, the assets from the old-pics and videos folders should show up in the main timeline.

### Set Custom Scan Interval

:::note
Only an admin can do this.
:::

You can define a custom interval for the trigger external library rescan under Administration -> Settings -> Library.  
You can set the scanning interval using the preset or cron format. For more information you can refer to [Crontab Guru](https://crontab.guru/).

<img src={require('./img/library-custom-scan-interval.png').default} width="75%" title='Set custom scan interval for external library' />
