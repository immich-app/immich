# Cloud Media Provider Integration

## Overview

The Immich app now integrates with the Android photo picker to provide cloud media content. This feature allows users to access and choose both locally stored media and cloud-backed photos or videos from within one unified interface.

## Permissions Required

To enable this feature, the following permissions are required in the `AndroidManifest.xml` file:

```xml
<uses-permission android:name="android.permission.MANAGE_CLOUD_MEDIA_PROVIDERS" />
```

## Implementation

The `CloudMediaProvider` class is implemented to extend the `ContentProvider` and override several key methods:

- `onGetMediaCollectionInfo(Bundle extras)`: Returns a bundle containing media collection info.
- `onQueryMedia(Bundle extras)`: Returns a cursor that lists all media items.
- `onQueryAlbums(Bundle extras)`: Returns a cursor with album metadata.
- `onOpenMedia(String mediaId, Bundle extras, CancellationSignal signal)`: Returns a file descriptor for the media item.
- `onOpenPreview(String mediaId, Point size, Bundle extras, CancellationSignal signal)`: Returns a file descriptor for the preview image.

## Usage Instructions

1. Add the necessary permissions and intent filters in `AndroidManifest.xml`.
2. Implement the `CloudMediaProvider` class and related methods.
3. Register the `CloudMediaProvider` in `MainActivity.kt`.

## Example

Here is an example of how to add the necessary permissions and intent filters in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.MANAGE_CLOUD_MEDIA_PROVIDERS" />

<application ...>
    <provider
        android:name=".CloudMediaProvider"
        android:authorities="app.alextran.immich.cloudmediaprovider"
        android:exported="true" />
</application>
```

## Conclusion

By following the above steps, you can integrate the cloud media provider feature into the Immich app, allowing users to seamlessly access and choose media from both local and cloud sources.
