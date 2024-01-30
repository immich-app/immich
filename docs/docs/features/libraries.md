# Libraries

## Overview

Immich supports the creation of libraries which is a top-level asset container. Currently, there are two types of libraries: traditional upload libraries that can sync with a mobile device, and external libraries, that keeps up to date with files on disk. Libraries are different from albums in that an asset can belong to multiple albums but only one library, and deleting a library deletes all assets contained within. As of August 2023, this is a new feature and libraries have a lot of potential for future development beyond what is documented here. This document attempts to describe the current state of libraries.

## The Upload Library

Immich comes preconfigured with an upload library for each user. All assets uploaded to Immich are added to this library. This library can be renamed, but not deleted. The upload library is the only library that can be synced with a mobile device. No items in an upload library is allowed to have the same sha1 hash as another item in the same library in order to prevent duplicates.

## External Libraries

External libraries tracks assets stored outside of immich, i.e. in the file system. Immich will only read data from the files, and will not modify them in any way. Therefore, the delete button is disabled for external assets. When the external library is scanned, immich will read the metadata from the file and create an asset in the library for each image or video file. These items will then be shown in the main timeline, and they will look and behave like any other asset, including viewing on the map, adding to albums, etc.

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

Finally, files can be deleted from Immich via the `Remove Offline Files` job. This job can be found by the three dots menu for the associated external storage that was configured under user account settings > libraries (the same location described at [create external libraries](#create-external-libraries)). When this job is run, any assets marked as offline will then be removed from Immich. Run this job whenever files have been deleted from the file system and you want to remove them from Immich.

### Import Paths

External libraries use import paths to determine which files to scan. Each library can have multiple import paths so that files from different locations can be added to the same library. Import paths are scanned recursively, and if a file is in multiple import paths, it will only be added once. If the import paths are edited in a way that an external file is no longer in any import path, it will be removed from the library in the same way a deleted file would. If the file is moved back to an import path, it will be added again as if it was a new file.

### Troubleshooting

Sometimes, an external library will not scan correctly. This can happen if the immich_server or immich_microservices can't access the files. Here are some things to check:

- Is the external path set correctly?
- In the docker-compose file, are the volumes mounted correctly?
- Are the volumes identical between the `server` and `microservices` container?
- Are the import paths set correctly, and do they match the path set in docker-compose file?
- Are you using symbolic link in your import library?
- Are the permissions set correctly?
- Are you using forward slashes everywhere? (`/`)
- Are you using symlink across docker mounts?
- Are you using [spaces in the internal path](/docs/features/libraries#:~:text=can%20be%20accessed.-,NOTE,-Spaces%20in%20the)?

If all else fails, you can always start a shell inside the container and check if the path is accessible. For example, `docker exec -it immich_microservices /bin/bash` will start a bash shell. If your import path, for instance, is `/data/import/photos`, you can check if the files are accessible by running `ls /data/import/photos`. Also check the `immich_server` container in the same way.

### Security Considerations

:::caution

Please read and understand this section before setting external paths, as there are important security considerations.

:::

For security purposes, each Immich user is disallowed to add external files by default. This is to prevent devastating [path traversal attacks](https://owasp.org/www-community/attacks/Path_Traversal). An admin can allow individual users to use external path feature via the `external path` setting found in the admin panel. Without the external path restriction, a user can add any image or video file on the Immich host filesystem to be imported into Immich, potentially allowing sensitive data to be accessed. If you are running Immich as root in your Docker setup (which is the default), all external file reads are done with root privileges. This is particularly dangerous if the Immich host is a shared server.

With the `external path` set, a user is restricted to accessing external files to files or directories within that path. The Immich admin should still be careful not set the external path too generously. For example, `user1` wants to read their photos in to `/home/user1`. A lazy admin sets that user's external path to `/home/` since it "gets the job done". However, that user will then be able to read all photos in `/home/user2/private-photos`, too! Please set the external path as specific as possible. If multiple folders must be added, do this using the docker volume mount feature described below.

### Exclusion Patterns

By default, all files in the import paths will be added to the library. If there are files that should not be added, exclusion patterns can be used to exclude them. Exclusion patterns are glob patterns are matched against the full file path. If a file matches an exclusion pattern, it will not be added to the library. Exclusion patterns can be added in the Scan Settings page for each library. Under the hood, Immich uses the [glob](https://www.npmjs.com/package/glob) package to match patterns, so please refer to [their documentation](https://github.com/isaacs/node-glob#glob-primer) to see what patterns are supported.

Some basic examples:

- `**/*.tif` will exclude all files with the extension `.tif`
- `**/hidden.jpg` will exclude all files named `hidden.jpg`
- `**/Raw/**` will exclude all files in any directory named `Raw`
- `**/*.{tif,jpg}` will exclude all files with the extension `.tif` or `.jpg`

### Automatic watching (EXPERIMENTAL)

This feature - currently hidden in the config file - is considered experimental and for advanced users only. If enabled, it will allow automatic watching of the filesystem which means new assets are automatically imported to Immich without needing to rescan. Deleted assets are, as always, marked as offline and can be removed with the "Remove offline files" button.

If your photos are on a network drive you will likely have to enable filesystem polling. The performance hit for polling large libraries is currently unknown, feel free to test this feature and report back. In addition to the boolean feature flag, the configuration file allows customization of the following parameters, please see the [chokidar documentation](https://github.com/paulmillr/chokidar?tab=readme-ov-file#performance) for reference.

- `usePolling` (default: `false`).
- `interval`. (default: 10000). When using polling, this is how often (in milliseconds) the filesystem is polled.

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

### Set External Path

Only an admin can do this.

- Navigate to `Administration > Users` page on the web.
- Click on the user edit button.
- Set `/mnt/media` to be the external path. This folder will only contain the three folders that we want to import, so nothing else can be accessed.
  :::note
  Spaces in the internal path aren't currently supported.

  You must import it as:
  `..:/mnt/media/my-media:ro`
  instead of
  `..:/mnt/media/my media:ro`
  :::

### Create External Libraries

- Click on your user name in the top right corner -> Account Settings
- Click on Libraries
- Click on Create External Library
- Click the drop-down menu on the newly created library
- Click on Rename Library and rename it to "Christmas Trip"
- Click Edit Import Paths
- Click on Add Path
- Enter `/mnt/media/christmas-trip` then click Add

NOTE: We have to use the `/mnt/media/christmas-trip` path and not the `/mnt/nas/christmas-trip` path since all paths have to be what the Docker containers see.

Next, we'll add an exclusion pattern to filter out raw files.

- Click the drop-down menu on the newly christmas library
- Click on Manage
- Click on Scan Settings
- Click on Add Exclusion Pattern
- Enter `**/Raw/**` and click save.
- Click save
- Click the drop-down menu on the newly created library
- Click on Scan Library Files

The christmas trip library will now be scanned in the background. In the meantime, let's add the videos and old photos to another library.

- Click on Create External Library.

:::info Note
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
