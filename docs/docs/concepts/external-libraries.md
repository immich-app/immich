# External libraries

:::info
Currently an external library can only belong to a single user which is selected when the library is initially created.
:::

External libraries track assets stored in the filesystem outside of Immich. When the external library is scanned, Immich will load videos and photos from disk and create the corresponding assets. These assets will then be shown in the main timeline, and they will look and behave like any other asset, including viewing on the map, adding to albums, etc. Later, if a file is modified outside of Immich, you need to scan the library for the changes to show up.

If an external asset is deleted from disk, Immich will move it to trash on rescan. To restore the asset, you need to restore the original file. After 30 days the file will be removed from trash, and any changes to metadata within Immich will be lost.

:::caution

If you add metadata to an external asset in any way (i.e. add it to an album or edit the description), that metadata is only stored inside Immich and will not be persisted to the external asset file. If you move an asset to another location within the library all such metadata will be lost upon rescan. This is because the asset is considered a new asset after the move. This is a known issue and will be fixed in a future release.

:::

:::caution

Due to aggressive caching it can take some time for a refreshed asset to appear correctly in the web view. You need to clear the cache in your browser to see the changes. This is a known issue and will be fixed in a future release. In Chrome, you need to open the developer console with F12, then reload the page with F5, and finally right click on the reload button and select "Empty Cache and Hard Reload".

:::

To set one up, see [Add an external library](/administration/add-an-external-library).

## What a library contains

A library's contents are defined by its **import paths** — the directories it scans — minus its **exclusion patterns**. Both are properties of the library, and both are evaluated on every scan, so changing either one adds or removes assets on the next scan rather than only affecting new files.

That symmetry is the thing to keep in mind: a file that stops matching, because a path was removed or a pattern was added, leaves the library the same way a file deleted from disk would.

See [External Library settings](/reference/system-settings#external-library) for how these are configured, and [Exclusion patterns](/reference/exclusion-patterns) for the pattern syntax.

## Automatic watching (EXPERIMENTAL)

This feature is considered experimental and for advanced users only. If enabled, it will allow automatic watching of the filesystem which means new assets are automatically imported to Immich without needing to rescan.

If your photos are on a network drive, automatic file watching likely won't work. In that case, you will have to rely on a [periodic library refresh](/administration/add-an-external-library#set-a-custom-scan-interval) to pull in your changes.

### Troubleshooting

If you encounter an `ENOSPC` error, you need to increase your file watcher limit. In sysctl, this key is called `fs.inotify.max_user_watches` and has a default value of 8192. Increase this number to a suitable value greater than the number of files you will be watching. Note that Immich has to watch all files in your import paths including any ignored files.

```
ERROR [LibraryService] Library watcher for library c69faf55-f96d-4aa0-b83b-2d80cbc27d98 encountered error: Error: ENOSPC: System limit for number of file watchers reached, watch '/media/photo.jpg'
```

In rare cases, the library watcher can hang, preventing Immich from starting up. In this case, disable the library watcher in the configuration file. If the watcher is enabled from within Immich, the app must be started without the microservices. Disable the microservices in the docker compose file, start Immich, disable the library watcher in the admin settings, close Immich, re-enable the microservices, and then Immich can be started normally.

## Deleting a library

When deleting an external library, all assets inside are immediately deleted along with the library. Note that while a library can take a long time to fully delete in the background, it is immediately removed from the library list. If the deletion process is interrupted (for example, due to server restart), it will be cleaned up in the next nightly cron job. The cleanup process can also be manually initiated by clicking the "Scan All Libraries" button in the library list.
