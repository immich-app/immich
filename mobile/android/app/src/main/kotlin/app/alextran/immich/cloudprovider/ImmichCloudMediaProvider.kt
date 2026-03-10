package app.alextran.immich.cloudprovider

import android.content.ContentResolver
import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.database.MatrixCursor
import android.graphics.Point
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.CloudMediaProvider
import android.provider.CloudMediaProviderContract
import android.util.Log
import androidx.annotation.RequiresApi
import java.io.FileNotFoundException

private const val TAG = "ImmichCloudMedia"
private const val CATEGORY_PEOPLE = "immich_people"
private const val CATEGORY_TYPE_PEOPLE_AND_PETS =
  "com.android.providers.media.MEDIA_CATEGORY_TYPE_PEOPLE_AND_PETS"
private const val SUGGESTION_TYPE_FACE =
  "com.android.providers.media.SEARCH_SUGGESTION_FACE"

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

  @RequiresApi(36)
  override fun onGetCapabilities(): CloudMediaProviderContract.Capabilities {
    Log.d(TAG, "onGetCapabilities called")
    return CloudMediaProviderContract.Capabilities.Builder()
      .setSearchEnabled(true)
      .setMediaCategoriesEnabled(true)
      .build()
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

    val cursor = buildMediaCursor(result)

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

    Log.d(TAG, "onQueryMedia: returning ${result.assets.size} assets, nextPage=${result.nextPageToken}")
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

  @RequiresApi(36)
  override fun onQueryMediaCategories(
    parentCategoryId: String?,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    Log.d(TAG, "onQueryMediaCategories: parentCategoryId=$parentCategoryId")

    val cursor = MatrixCursor(MEDIA_CATEGORY_PROJECTION)

    if (parentCategoryId == null) {
      cursor.addRow(
        arrayOf(
          CATEGORY_PEOPLE,
          "People",
          CATEGORY_TYPE_PEOPLE_AND_PETS,
          null, null, null, null
        )
      )
    }

    cursor.extras = buildCollectionIdExtras()
    Log.d(TAG, "onQueryMediaCategories: returning ${cursor.count} categories")
    return cursor
  }

  @RequiresApi(36)
  override fun onQueryMediaSets(
    mediaCategoryId: String,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    val pageSize = extras.getInt(CloudMediaProviderContract.EXTRA_PAGE_SIZE, 100)
    Log.d(TAG, "onQueryMediaSets: categoryId=$mediaCategoryId, pageSize=$pageSize")

    val cursor = MatrixCursor(MEDIA_SET_PROJECTION)

    if (mediaCategoryId == CATEGORY_PEOPLE) {
      val people = ImmichCloudRepository.queryPeople()
      for (person in people) {
        cursor.addRow(
          arrayOf(
            person.id,
            person.name,
            null,
            person.coverAssetId
          )
        )
      }
      Log.d(TAG, "onQueryMediaSets: returning ${people.size} people")
    }

    cursor.extras = buildCollectionIdExtras()
    return cursor
  }

  @RequiresApi(36)
  override fun onQueryMediaInMediaSet(
    mediaSetId: String,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    val pageSize = extras.getInt(CloudMediaProviderContract.EXTRA_PAGE_SIZE, 500)
    val pageToken = extras.getString(CloudMediaProviderContract.EXTRA_PAGE_TOKEN)
    Log.d(TAG, "onQueryMediaInMediaSet: mediaSetId=$mediaSetId, pageSize=$pageSize, pageToken=$pageToken")

    val result = ImmichCloudRepository.queryPersonAssets(
      personId = mediaSetId,
      pageSize = pageSize,
      pageToken = pageToken
    )

    val cursor = buildMediaCursor(result)

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
    cursor.extras = cursorExtras

    Log.d(TAG, "onQueryMediaInMediaSet: returning ${result.assets.size} assets")
    return cursor
  }

  @RequiresApi(36)
  override fun onQuerySearchSuggestions(
    prefixText: String,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    Log.d(TAG, "onQuerySearchSuggestions: prefixText='$prefixText'")

    val cursor = MatrixCursor(SEARCH_SUGGESTION_PROJECTION)
    val people = ImmichCloudRepository.queryPeople()

    for (person in people) {
      if (prefixText.isNotEmpty() && !person.name.contains(prefixText, ignoreCase = true)) continue
      cursor.addRow(
        arrayOf(
          person.id,
          person.name,
          SUGGESTION_TYPE_FACE,
          person.coverAssetId
        )
      )
    }

    cursor.extras = buildCollectionIdExtras()
    Log.d(TAG, "onQuerySearchSuggestions: returning ${cursor.count} suggestions")
    return cursor
  }

  @RequiresApi(36)
  override fun onSearchMedia(
    suggestedMediaSetId: String,
    fallbackSearchText: String?,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    val pageSize = extras.getInt(CloudMediaProviderContract.EXTRA_PAGE_SIZE, 500)
    val pageToken = extras.getString(CloudMediaProviderContract.EXTRA_PAGE_TOKEN)
    Log.d(TAG, "onSearchMedia (suggestion): mediaSetId=$suggestedMediaSetId, pageSize=$pageSize")

    val result = ImmichCloudRepository.queryPersonAssets(
      personId = suggestedMediaSetId,
      pageSize = pageSize,
      pageToken = pageToken
    )

    val cursor = buildMediaCursor(result)
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
    cursor.extras = cursorExtras

    Log.d(TAG, "onSearchMedia (suggestion): returning ${result.assets.size} assets")
    return cursor
  }

  @RequiresApi(36)
  override fun onSearchMedia(
    searchText: String,
    extras: Bundle,
    cancellationSignal: CancellationSignal?
  ): Cursor {
    Log.d(TAG, "onSearchMedia (text): query='$searchText'")

    val result = ImmichCloudRepository.searchAssets(
      query = searchText,
      pageSize = 25
    )

    val cursor = buildMediaCursor(result)
    cursor.extras = buildCollectionIdExtras()

    Log.d(TAG, "onSearchMedia (text): returning ${result.assets.size} assets")
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

  private fun buildMediaCursor(result: QueryResult): MatrixCursor {
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
    return cursor
  }

  private fun buildCollectionIdExtras(): Bundle {
    val extras = Bundle()
    extras.putString(
      CloudMediaProviderContract.EXTRA_MEDIA_COLLECTION_ID,
      ImmichCloudRepository.getMediaCollectionId()
    )
    return extras
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

    @RequiresApi(36)
    private val MEDIA_CATEGORY_PROJECTION = arrayOf(
      CloudMediaProviderContract.MediaCategoryColumns.ID,
      CloudMediaProviderContract.MediaCategoryColumns.DISPLAY_NAME,
      CloudMediaProviderContract.MediaCategoryColumns.MEDIA_CATEGORY_TYPE,
      CloudMediaProviderContract.MediaCategoryColumns.MEDIA_COVER_ID1,
      CloudMediaProviderContract.MediaCategoryColumns.MEDIA_COVER_ID2,
      CloudMediaProviderContract.MediaCategoryColumns.MEDIA_COVER_ID3,
      CloudMediaProviderContract.MediaCategoryColumns.MEDIA_COVER_ID4
    )

    @RequiresApi(36)
    private val MEDIA_SET_PROJECTION = arrayOf(
      CloudMediaProviderContract.MediaSetColumns.ID,
      CloudMediaProviderContract.MediaSetColumns.DISPLAY_NAME,
      CloudMediaProviderContract.MediaSetColumns.MEDIA_COUNT,
      CloudMediaProviderContract.MediaSetColumns.MEDIA_COVER_ID
    )

    @RequiresApi(36)
    private val SEARCH_SUGGESTION_PROJECTION = arrayOf(
      CloudMediaProviderContract.SearchSuggestionColumns.MEDIA_SET_ID,
      CloudMediaProviderContract.SearchSuggestionColumns.DISPLAY_TEXT,
      CloudMediaProviderContract.SearchSuggestionColumns.TYPE,
      CloudMediaProviderContract.SearchSuggestionColumns.MEDIA_COVER_ID
    )
  }
}
