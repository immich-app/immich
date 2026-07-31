# Backups

Photos and videos are usually irreplaceable. Unlike most self-hosted data, there is no upstream copy to re-download and no way to recreate a lost photo — which makes backups the single most important part of running Immich.

Immich does not back itself up. It creates database dumps, and it tells you which files matter, but taking, storing, and testing an actual backup is left to you and the backup tool of your choice. A [3-2-1 backup](/reference/3-2-1-backup-method) is the usual target: three copies, on two different kinds of storage, with one copy off-site.

## What a complete backup contains

An Immich backup has two halves, and it is only useful if you have both:

- **The database**, which holds asset metadata, album membership, recognized faces, tags, sharing, and the file path of every asset.
- **The original files**, which are the photos and videos themselves.

Neither half is sufficient alone. Without the files, the database describes assets that no longer exist. Without the database, the files remain on disk but Immich has no record of them — Immich does not scan its library folder to discover assets, so albums, people, and all other metadata are gone even though the images survive. This is why a copy of `UPLOAD_LOCATION` on its own is not a backup.

## Original versus generated content

Immich stores two kinds of content in the filesystem:

- **Original content** — the assets as uploaded, plus profile images. This is the irreplaceable part.
- **Generated content** — thumbnails, previews, and transcoded videos. These are derived from the originals and Immich can rebuild them by re-running the corresponding jobs.

Backing up everything is simplest and avoids a lengthy regeneration after a restore. Backing up only the original content produces a smaller backup at the cost of re-running the thumbnail and transcoding jobs when you restore.

## Automatic database backups

Immich periodically dumps its own database and keeps the last several dumps. These exist so that a database can be recovered without any external tooling — a corrupted database, a failed upgrade, a mistaken deletion.

They are not a substitute for a backup, for two reasons:

- They contain **metadata only**, never photos or videos.
- They are written inside `UPLOAD_LOCATION`, so they are lost along with everything else if that storage fails. An off-site copy is what protects against that.

Treat them as a convenience for recovering the database, and as one of the things your real backup needs to include.

## Consistency between the database and the files

Because a backup covers two moving parts, they can drift out of sync while it runs — an asset uploaded mid-backup may be recorded in one half and missing from the other. The result after a restore is broken assets.

Stopping the `immich-server` container for the duration of the backup removes the problem entirely: if nothing is changing, the two halves always agree.

If stopping the container is not an option, the order matters. Back up the database **first** and the filesystem **second**. The worst case is then a file on disk that the database does not know about, which can be re-uploaded manually. Backing up in the other order risks a restored database that references files absent from the backup, which cannot be recovered.

## Restoring

A restore puts the database back and expects the files to already be in place. Restoring a database taken from a different Immich version may require migrations, which Immich attempts automatically, so keeping backups aligned with the version that produced them makes recovery more predictable.

The mechanics — where the dumps live, how to trigger one, and every way to restore — are in [Backup and restore](/administration/back-up-and-restore).
