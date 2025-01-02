# XMP Sidecars

Immich can ingest XMP sidecars on file upload (via the CLI) as well as detect new sidecars that are placed in the filesystem for existing images.

<img src={require('./img/xmp-sidecars.webp').default} title='XMP sidecars' />

XMP sidecars are external XML files that contain metadata related to media files. Many applications read and write these files either exclusively or in addition to the metadata written to image files. They can be a powerful tool for editing and storing metadata of a media file without modifying the media file itself. When Immich receives or detects an XMP sidecar for a media file, it will attempt to extract the metadata from both the sidecar as well as the media file. It will prioritize the metadata for fields in the sidecar but will fall back and use the metadata in the media file if necessary.

When importing files via the CLI bulk uploader or parsing photo metadata for external libraries, Immich will automatically detect XMP sidecar files as files that exist next to the original media file. Immich will look files that have the same name as the photo, but with the `.xmp` file extension. The same name can either include the photo's file extension or without the photo's file extension. For example, for a photo named `PXL_20230401_203352928.MP.jpg`, Immich will look for an XMP file named either `PXL_20230401_203352928.MP.jpg.xmp` or `PXL_20230401_203352928.MP.xmp`. If both `PXL_20230401_203352928.MP.jpg.xmp` and `PXL_20230401_203352928.MP.xmp` are present, Immich will prefer `PXL_20230401_203352928.MP.jpg.xmp`.

There are 2 administrator jobs associated with sidecar files: `SYNC` and `DISCOVER`. The sync job will re-scan all media with existing sidecar files and queue them for a metadata refresh. This is a great use case when third-party applications are used to modify the metadata of media. The discover job will attempt to scan the filesystem for new sidecar files for all media that does not currently have a sidecar file associated with it.

<img src={require('./img/sidecar-jobs.webp').default} title='Sidecar Administrator Jobs' />
