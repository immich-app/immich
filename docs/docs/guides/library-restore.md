# Recovering your Immich Library
This guide will serve as a last resort method for attempting to recover your Immich installation if you had to reinstall Immich and your [database could not be restored.](https://immich.app/docs/administration/backup-and-restore)

:::caution There is no guarentee that this guide can restore your library succesfully. Always make sure to make periodic backups to your database and library. This guide is only to be used if your database can not be restored or if your backups failed:::

:::note This guide is currently only tested with the following configurations: | Server running Ubuntu Server using Docker for Immich | Desktop running Linux Mint | The steps should be able to be replicated in some capacity cross platform, but your milage may vary.:::

## Step 1: Preparing Immich

:::danger Make certain that you backup at least your ```UPLOAD_LOCATION``` before purging your install:::
Your Immich installation will need to be completely reset. Follow the FAQ guide located [here](https://immich.app/docs/administration/backup-and-restore) to purge your Immich install.::: 

:::tip After purging your install, restart your server. If you return to where your ```DB_DATA_LOCATION``` was and notice that a new database is created. You'll either need to reinstall postgres or install Immich in a different directory.:::

After you have purged your database, follow the [Quick start](https://immich.app/docs/overview/quick-start) guide to reinstall Immich. **Don't proceed in this guide until Immich is in a functioning state!**

## Step 2: Downloading your files.
At this stage the goal will be to download the media files (E.G. PNG) off of your server onto your desktop, then to upload them into Immich again. This will allow Immich to reorganize them in the database.

:::note There is a decent chance your PC can not store all of your media at once, it that is the case, simply download your files in smaller packages and repeat the steps below accordingly.:::

The easiest way to download your files would be to download them from something such as Nextcloud. But if your server does not have any file server available, you can use ```rsync or scp``` to download the files to your PC.

```scp <user>@<server-ip-address>:/path/to/file /path/to/dest/dir/```

Once your files are downloaded, you may notice that they are all in thousands of directories. Thankfully there is a quick command that you can use to move the files out of the massive directory nest into a single, managable folder.

First, create a directory to store your media.
```mkdir /new/path/to/media```

Second, execute the following command, replacing file paths as needed.
```find ./"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/"/ -type f -print0 | xargs -0 mv -t /new/path/to/media```.

If everything went correctly, you should now have all of your media in a single directory.

## Step 3: Uploading your files.
Now, simply log into your Immich Server via your web browser of choice, click ```Upload```, select all of your media, and click ```Open```.

It may take 5-10 minutes for the uploads to begin. Be patient. If your upload never starts even after 10 minutes, you may need to upload your photos in smaller chunks. 

:::danger Make sure to leave your computer on until all of your media has been reuploaded. Failure to do so may lead to failed uploads:::
