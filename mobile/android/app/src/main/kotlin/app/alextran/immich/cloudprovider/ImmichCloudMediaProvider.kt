package app.alextran.immich.cloudprovider

import android.content.ContentResolver
import android.content.Intent
import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.database.MatrixCursor
import android.graphics.Point
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.CloudMediaProvider
import android.provider.CloudMediaProviderContract
import android.util.Log
import androidx.annotation.RequiresApi
import java.io.FileNotFoundException

private const val TAG = "ImmichCloudMedia"

@RequiresApi(34)
class ImmichCloudMediaProvider : CloudMediaProvider() {

  override fun onCreate(): Boolean {
    val ctx = context ?: return false
    ImmichCloudRepository.initialize(ctx)
    ImmichCloudRepository.detectAndApplyChanges()
    return true
  }

  override fun onGetMediaCollectionInfo(extras: Bundle): Bundle {
    checkPermission()
    val ctx = context ?: return Bundle()
    Log.d(TAG, "onGetMediaCollectionInfo called")
    val bundle = Bundle()
    bundle.putString(
      CloudMediaProviderContract.MediaCollectionInfo.MEDIA_COLLECTION_ID,
      ImmichCloudRepository.getMediaCollectionId()
    )
    bundle.putLong(
      CloudMediaProviderContract.MediaCollectionInfo.LAST_MEDIA_SYNC_GENERATION,
      ImmichCloudRepository.getLastSyncGeneration()
    )
    bundle.putString(
      CloudMediaProviderContract.MediaCollectionInfo.ACCOUNT_NAME,
      ImmichCloudRepository.getAccountName()
    )

    val launchIntent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
    if (launchIntent != null) {
      bundle.putParcelable(
        CloudMediaProviderContract.MediaCollectionInfo.ACCOUNT_CONFIGURATION_INTENT,
        launchIntent
      )
    }

    Log.d(TAG, "onGetMediaCollectionInfo: collectionId=${ImmichCloudRepository.getMediaCollectionId()}, " +
      "syncGen=${ImmichCloudRepository.getLastSyncGeneration()}, " +
      "accountName=${ImmichCloudRepository.getAccountName()}")

    return bundle
  }

  override fun onQueryMedia(extras: Bundle): Cursor {
    checkPermission()
    val syncGeneration = extras.getLong(
      CloudMediaProviderContract.EXTRA_SYNC_GENERATION, 0
    )
    val albumId = extras.getString(CloudMediaProviderContract.EXTRA_ALBUM_ID)
    val pageSize = extras.getInt(CloudMediaProviderContract.EXTRA_PAGE_SIZE, 1000)
    val pageToken = extras.getString(CloudMediaProviderContract.EXTRA_PAGE_TOKEN)

    Log.d(TAG, "onQueryMedia: syncGen=$syncGeneration, albumId=$albumId, pageSize=$pageSize, pageToken=$pageToken")

    val result = if (albumId != null) {
      ImmichCloudRepository.queryAlbumAssets(
        albumId = albumId,
        pageSize = pageSize,
        pageToken = pageToken
      )
    } else {
      ImmichCloudRepository.queryAllAssets(
        syncGeneration = syncGeneration,
        pageSize = pageSize,
        pageToken = pageToken
      )
    }

    val cursor = MatrixCursor(MEDIA_PROJECTION)
    for (asset in result.assets) {
      cursor.addRow(
        arrayOf(
          asset.id,
          asset.mimeType,
          asset.dateTakenMillis,
          ImmichCloudRepository.getLastSyncGeneration(),
          asset.sizeBytes,
          if (asset.durationMillis > 0) asset.durationMillis else null,
          if (asset.isFavorite) 1 else 0,
          if (asset.width > 0) asset.width else null,
          if (asset.height > 0) asset.height else null,
          if (asset.orientation != 0) asset.orientation else null,
          getStandardMimeTypeExtension(asset.mimeType),
          null
        )
      )
    }

    Log.d(TAG, "onQueryMedia: returning ${result.assets.size} assets, nextPage=${result.nextPageToken}")

    if (result.nextPageToken == null && albumId == null) {
      ImmichCloudRepository.snapshotCurrentAssetIds()
    }

    val cursorExtras = Bundle()
    cursorExtras.putString(
      CloudMediaProviderContract.EXTRA_MEDIA_COLLECTION_ID,
      ImmichCloudRepository.getMediaCollectionId()
    )
    if (result.nextPageToken != null) {
      cursorExtras.putString(
        CloudMediaProviderContract.EXTRA_PAGE_TOKEN,
        result.nextPageToken
      )
    }
    val honoredArgs = arrayListOf(
      CloudMediaProviderContract.EXTRA_PAGE_SIZE,
      CloudMediaProviderContract.EXTRA_PAGE_TOKEN,
      CloudMediaProviderContract.EXTRA_SYNC_GENERATION
    )
    if (albumId != null) honoredArgs.add(CloudMediaProviderContract.EXTRA_ALBUM_ID)
    cursorExtras.putStringArrayList(ContentResolver.EXTRA_HONORED_ARGS, honoredArgs)
    cursor.extras = cursorExtras

    return cursor
  }

  override fun onQueryDeletedMedia(extras: Bundle): Cursor {
    checkPermission()
    val syncGeneration = extras.getLong(
      CloudMediaProviderContract.EXTRA_SYNC_GENERATION, 0
    )

    Log.d(TAG, "onQueryDeletedMedia: syncGen=$syncGeneration")

    val deletedIds = ImmichCloudRepository.queryDeletedAssets(syncGeneration)

    val cursor = MatrixCursor(arrayOf(CloudMediaProviderContract.MediaColumns.ID))
    for (id in deletedIds) {
      cursor.addRow(arrayOf(id))
    }

    Log.d(TAG, "onQueryDeletedMedia: returning ${deletedIds.size} deleted IDs")

    val cursorExtras = Bundle()
    cursorExtras.putString(
      CloudMediaProviderContract.EXTRA_MEDIA_COLLECTION_ID,
      ImmichCloudRepository.getMediaCollectionId()
    )
    cursorExtras.putStringArrayList(
      ContentResolver.EXTRA_HONORED_ARGS,
      arrayListOf(CloudMediaProviderContract.EXTRA_SYNC_GENERATION)
    )
    cursor.extras = cursorExtras

    return cursor
  }

  override fun onQueryAlbums(extras: Bundle): Cursor {
    checkPermission()
    val albums = ImmichCloudRepository.queryAlbums()

    val cursor = MatrixCursor(ALBUM_PROJECTION)
    for (album in albums) {
      if (album.coverAssetId == null) continue
      cursor.addRow(
        arrayOf(
          album.id,
          album.displayName,
          album.mediaCount,
          album.coverAssetId,
          album.dateTakenMillis
        )
      )
    }

    val cursorExtras = Bundle()
    cursorExtras.putString(
      CloudMediaProviderContract.EXTRA_MEDIA_COLLECTION_ID,
      ImmichCloudRepository.getMediaCollectionId()
    )
    cursorExtras.putStringArrayList(
      ContentResolver.EXTRA_HONORED_ARGS,
      arrayListOf(CloudMediaProviderContract.EXTRA_SYNC_GENERATION)
    )
    cursor.extras = cursorExtras

    Log.d(TAG, "onQueryAlbums: returning ${albums.size} albums")

    return cursor
  }

  @Throws(FileNotFoundException::class)
  override fun onOpenMedia(
    mediaId: String,
    extras: Bundle?,
    cancellationSignal: CancellationSignal?
  ): ParcelFileDescriptor {
    checkPermission()
    return ImmichCloudRepository.openMedia(mediaId)
      ?: throw FileNotFoundException("Failed to open media: $mediaId")
  }

  @Throws(FileNotFoundException::class)
  override fun onOpenPreview(
    mediaId: String,
    size: Point,
    extras: Bundle?,
    cancellationSignal: CancellationSignal?
  ): AssetFileDescriptor {
    checkPermission()
    val fd = ImmichCloudRepository.openPreview(mediaId, size)
      ?: throw FileNotFoundException("Failed to open preview: $mediaId")
    return AssetFileDescriptor(fd, 0, AssetFileDescriptor.UNKNOWN_LENGTH)
  }

  override fun onCreateCloudMediaSurfaceController(
    config: Bundle,
    callback: CloudMediaSurfaceStateChangedCallback
  ): CloudMediaSurfaceController {
    val ctx = context ?: throw IllegalStateException("Provider not attached")
    return ImmichSurfaceController(ctx, config, callback)
  }

  private fun checkPermission() {
    val caller = callingPackage ?: return
    val ctx = context ?: return
    val permission = ctx.checkCallingPermission(
      CloudMediaProviderContract.MANAGE_CLOUD_MEDIA_PROVIDERS_PERMISSION
    )
    if (permission != android.content.pm.PackageManager.PERMISSION_GRANTED) {
      Log.w(TAG, "Caller $caller lacks MANAGE_CLOUD_MEDIA_PROVIDERS_PERMISSION")
    }
  }

  private fun getStandardMimeTypeExtension(mimeType: String): Int {
    return when {
      mimeType == "image/gif" ->
        CloudMediaProviderContract.MediaColumns.STANDARD_MIME_TYPE_EXTENSION_GIF
      mimeType == "image/webp" ->
        CloudMediaProviderContract.MediaColumns.STANDARD_MIME_TYPE_EXTENSION_ANIMATED_WEBP
      mimeType.contains("motion") ->
        CloudMediaProviderContract.MediaColumns.STANDARD_MIME_TYPE_EXTENSION_MOTION_PHOTO
      else ->
        CloudMediaProviderContract.MediaColumns.STANDARD_MIME_TYPE_EXTENSION_NONE
    }
  }

  companion object {
    private val MEDIA_PROJECTION = arrayOf(
      CloudMediaProviderContract.MediaColumns.ID,
      CloudMediaProviderContract.MediaColumns.MIME_TYPE,
      CloudMediaProviderContract.MediaColumns.DATE_TAKEN_MILLIS,
      CloudMediaProviderContract.MediaColumns.SYNC_GENERATION,
      CloudMediaProviderContract.MediaColumns.SIZE_BYTES,
      CloudMediaProviderContract.MediaColumns.DURATION_MILLIS,
      CloudMediaProviderContract.MediaColumns.IS_FAVORITE,
      CloudMediaProviderContract.MediaColumns.WIDTH,
      CloudMediaProviderContract.MediaColumns.HEIGHT,
      CloudMediaProviderContract.MediaColumns.ORIENTATION,
      CloudMediaProviderContract.MediaColumns.STANDARD_MIME_TYPE_EXTENSION,
      CloudMediaProviderContract.MediaColumns.MEDIA_STORE_URI
    )

    private val ALBUM_PROJECTION = arrayOf(
      CloudMediaProviderContract.AlbumColumns.ID,
      CloudMediaProviderContract.AlbumColumns.DISPLAY_NAME,
      CloudMediaProviderContract.AlbumColumns.MEDIA_COUNT,
      CloudMediaProviderContract.AlbumColumns.MEDIA_COVER_ID,
      CloudMediaProviderContract.AlbumColumns.DATE_TAKEN_MILLIS
    )
  }
}
