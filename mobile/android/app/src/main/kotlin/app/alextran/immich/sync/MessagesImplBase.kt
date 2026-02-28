package app.alextran.immich.sync

import android.annotation.SuppressLint
import android.content.ContentUris
import android.content.Context
import android.database.Cursor
import androidx.exifinterface.media.ExifInterface
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import androidx.core.database.getStringOrNull
import app.alextran.immich.core.ImmichPlugin
import com.bumptech.glide.Glide
import com.bumptech.glide.load.ImageHeaderParser
import com.bumptech.glide.load.ImageHeaderParserUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import java.io.File
import java.security.MessageDigest
import kotlin.coroutines.cancellation.CancellationException

sealed class AssetResult {
  data class ValidAsset(val asset: PlatformAsset, val albumId: String) : AssetResult()
  data class InvalidAsset(val assetId: String) : AssetResult()
}

private const val TAG = "NativeSyncApiImplBase"

@SuppressLint("InlinedApi")
open class NativeSyncApiImplBase(context: Context) : ImmichPlugin() {
  private val ctx: Context = context.applicationContext

  private var hashTask: Job? = null

  companion object {
    private const val MAX_CONCURRENT_HASH_OPERATIONS = 16
    private val hashSemaphore = Semaphore(MAX_CONCURRENT_HASH_OPERATIONS)
    private const val HASHING_CANCELLED_CODE = "HASH_CANCELLED"

    // MediaStore.Files.FileColumns.SPECIAL_FORMAT — S Extensions 21+
    // https://developer.android.com/reference/android/provider/MediaStore.Files.FileColumns#SPECIAL_FORMAT
    private const val SPECIAL_FORMAT_COLUMN = "_special_format"
    private const val SPECIAL_FORMAT_GIF = 1
    private const val SPECIAL_FORMAT_MOTION_PHOTO = 2
    private const val SPECIAL_FORMAT_ANIMATED_WEBP = 3

    const val MEDIA_SELECTION =
      "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"
    val MEDIA_SELECTION_ARGS = arrayOf(
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
    )
    const val BUCKET_SELECTION = "(${MediaStore.Files.FileColumns.BUCKET_ID} = ?)"
    val ASSET_PROJECTION = buildList {
      add(MediaStore.MediaColumns._ID)
      add(MediaStore.MediaColumns.DATA)
      add(MediaStore.MediaColumns.DISPLAY_NAME)
      add(MediaStore.MediaColumns.DATE_TAKEN)
      add(MediaStore.MediaColumns.DATE_ADDED)
      add(MediaStore.MediaColumns.DATE_MODIFIED)
      add(MediaStore.Files.FileColumns.MEDIA_TYPE)
      add(MediaStore.MediaColumns.BUCKET_ID)
      add(MediaStore.MediaColumns.WIDTH)
      add(MediaStore.MediaColumns.HEIGHT)
      add(MediaStore.MediaColumns.DURATION)
      add(MediaStore.MediaColumns.ORIENTATION)
      // IS_FAVORITE is only available on Android 11 and above
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(MediaStore.MediaColumns.IS_FAVORITE)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        add(SPECIAL_FORMAT_COLUMN)
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // Fallback: read XMP from MediaStore to detect Motion Photos
        add(MediaStore.MediaColumns.XMP)
      }
    }.toTypedArray()

    const val HASH_BUFFER_SIZE = 2 * 1024 * 1024
  }

  protected fun getCursor(
    volume: String,
    selection: String,
    selectionArgs: Array<String>,
    projection: Array<String> = ASSET_PROJECTION,
    sortOrder: String? = null
  ): Cursor? = ctx.contentResolver.query(
    MediaStore.Files.getContentUri(volume),
    projection,
    selection,
    selectionArgs,
    sortOrder,
  )

  protected fun getCursor(
    volume: String,
    queryArgs: Bundle
  ): Cursor? = ctx.contentResolver.query(
    MediaStore.Files.getContentUri(volume),
    ASSET_PROJECTION,
    queryArgs,
    null
  )

  protected fun getAssets(cursor: Cursor?): Sequence<AssetResult> {
    return sequence {
      cursor?.use { c ->
        val idColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
        val dataColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA)
        val nameColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
        val dateTakenColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_TAKEN)
        val dateAddedColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
        val dateModifiedColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)
        val mediaTypeColumn = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
        val bucketIdColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_ID)
        val widthColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.WIDTH)
        val heightColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.HEIGHT)
        val durationColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)
        val orientationColumn =
          c.getColumnIndexOrThrow(MediaStore.MediaColumns.ORIENTATION)
        val favoriteColumn = c.getColumnIndex(MediaStore.MediaColumns.IS_FAVORITE)
        val specialFormatColumn = c.getColumnIndex(SPECIAL_FORMAT_COLUMN)
        val xmpColumn = c.getColumnIndex(MediaStore.MediaColumns.XMP)

        while (c.moveToNext()) {
          val numericId = c.getLong(idColumn)
          val id = numericId.toString()
          val name = c.getStringOrNull(nameColumn)
          val bucketId = c.getStringOrNull(bucketIdColumn)
          val path = c.getStringOrNull(dataColumn)

          // Skip assets with invalid metadata
          if (
            name.isNullOrBlank() || bucketId.isNullOrBlank() ||
            path.isNullOrBlank() || !File(path).exists()
          ) {
            yield(AssetResult.InvalidAsset(id))
            continue
          }

          val rawMediaType = c.getInt(mediaTypeColumn)
          val assetType: Long = when (rawMediaType) {
            MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> 1L
            MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> 2L
            else -> 0L
          }
          // Date taken is milliseconds since epoch, Date added is seconds since epoch
          val createdAt = (c.getLong(dateTakenColumn).takeIf { it > 0 }?.div(1000))
            ?: c.getLong(dateAddedColumn)
          // Date modified is seconds since epoch
          val modifiedAt = c.getLong(dateModifiedColumn)
          val width = c.getInt(widthColumn).toLong()
          val height = c.getInt(heightColumn).toLong()
          // Duration is milliseconds
          val duration = if (rawMediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) 0L
          else c.getLong(durationColumn) / 1000
          val orientation = c.getInt(orientationColumn)
          val isFavorite = if (favoriteColumn == -1) false else c.getInt(favoriteColumn) != 0

          val playbackStyle = detectPlaybackStyle(
            numericId, rawMediaType, specialFormatColumn, xmpColumn, c
          )

          val asset = PlatformAsset(
            id,
            name,
            assetType,
            createdAt,
            modifiedAt,
            width,
            height,
            duration,
            orientation.toLong(),
            isFavorite,
            playbackStyle = playbackStyle,
          )
          yield(AssetResult.ValidAsset(asset, bucketId))
        }
      }
    }
  }

  /**
   * Detects the playback style for an asset using _special_format (API 33+)
   * or XMP / MIME / RIFF header fallbacks (pre-33).
   */
  @SuppressLint("NewApi")
  private fun detectPlaybackStyle(
    assetId: Long,
    rawMediaType: Int,
    specialFormatColumn: Int,
    xmpColumn: Int,
    cursor: Cursor
  ): PlatformAssetPlaybackStyle {
    // video currently has no special formats, so we can short circuit and avoid unnecessary work
    if (rawMediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
      return PlatformAssetPlaybackStyle.VIDEO
    }

    // API 33+: use _special_format from cursor
    if (specialFormatColumn != -1) {
      val specialFormat = cursor.getInt(specialFormatColumn)
      return when {
        specialFormat == SPECIAL_FORMAT_MOTION_PHOTO -> PlatformAssetPlaybackStyle.LIVE_PHOTO
        specialFormat == SPECIAL_FORMAT_GIF || specialFormat == SPECIAL_FORMAT_ANIMATED_WEBP -> PlatformAssetPlaybackStyle.IMAGE_ANIMATED
        rawMediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> PlatformAssetPlaybackStyle.IMAGE
        else -> PlatformAssetPlaybackStyle.UNKNOWN
      }
    }

    if (rawMediaType != MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
      return PlatformAssetPlaybackStyle.UNKNOWN
    }

    // Pre-API 33 fallback
    val uri = ContentUris.withAppendedId(
      MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL),
      assetId
    )

    // Read XMP from cursor (API 30+) or ExifInterface stream (pre-30)
    val xmp: String? = if (xmpColumn != -1) {
      cursor.getBlob(xmpColumn)?.toString(Charsets.UTF_8)
    } else {
      try {
        ctx.contentResolver.openInputStream(uri)?.use { stream ->
          ExifInterface(stream).getAttribute(ExifInterface.TAG_XMP)
        }
      } catch (e: Exception) {
        Log.w(TAG, "Failed to read XMP for asset $assetId", e)
        null
      }
    }

    if (xmp != null && "Camera:MotionPhoto" in xmp) {
      return PlatformAssetPlaybackStyle.LIVE_PHOTO
    }

    try {
      ctx.contentResolver.openInputStream(uri)?.use { stream ->
        val glide = Glide.get(ctx)
        val type = ImageHeaderParserUtils.getType(
          glide.registry.imageHeaderParsers,
          stream,
          glide.arrayPool
        )
        if (type == ImageHeaderParser.ImageType.GIF || type == ImageHeaderParser.ImageType.ANIMATED_WEBP) {
          return PlatformAssetPlaybackStyle.IMAGE_ANIMATED
        }
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to parse image header for asset $assetId", e)
    }

    return PlatformAssetPlaybackStyle.IMAGE
  }

  fun getAlbums(): List<PlatformAlbum> {
    val albums = mutableListOf<PlatformAlbum>()
    val albumsCount = mutableMapOf<String, Int>()

    val projection = arrayOf(
      MediaStore.Files.FileColumns.BUCKET_ID,
      MediaStore.Files.FileColumns.BUCKET_DISPLAY_NAME,
      MediaStore.Files.FileColumns.DATE_MODIFIED,
    )
    val selection =
      "(${MediaStore.Files.FileColumns.BUCKET_ID} IS NOT NULL) AND $MEDIA_SELECTION"

    getCursor(
      MediaStore.VOLUME_EXTERNAL,
      selection,
      MEDIA_SELECTION_ARGS,
      projection,
      "${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC"
    )?.use { cursor ->
      val bucketIdColumn =
        cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_ID)
      val bucketNameColumn =
        cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_DISPLAY_NAME)
      val dateModified =
        cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_MODIFIED)

      while (cursor.moveToNext()) {
        val id = cursor.getString(bucketIdColumn)

        val count = albumsCount.getOrDefault(id, 0)
        if (count != 0) {
          albumsCount[id] = count + 1
          continue
        }

        // MediaStore might return null for bucket name (commonly for the Root Directory), so default to "Internal Storage"
        val name = cursor.getStringOrNull(bucketNameColumn) ?: "Internal Storage"
        val updatedAt = cursor.getLong(dateModified)
        albums.add(PlatformAlbum(id, name, updatedAt, false, 0))
        albumsCount[id] = 1
      }
    }

    return albums.map { it.copy(assetCount = albumsCount[it.id]?.toLong() ?: 0) }
      .sortedBy { it.id }
  }

  fun getAssetIdsForAlbum(albumId: String): List<String> {
    val projection = arrayOf(MediaStore.MediaColumns._ID)

    return getCursor(
      MediaStore.VOLUME_EXTERNAL,
      "$BUCKET_SELECTION AND $MEDIA_SELECTION",
      arrayOf(albumId, *MEDIA_SELECTION_ARGS),
      projection
    )?.use { cursor ->
      val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
      generateSequence {
        if (cursor.moveToNext()) cursor.getLong(idColumn).toString() else null
      }.toList()
    } ?: emptyList()
  }

  fun getAssetsCountSince(albumId: String, timestamp: Long): Long =
    getCursor(
      MediaStore.VOLUME_EXTERNAL,
      "$BUCKET_SELECTION AND ${MediaStore.Files.FileColumns.DATE_ADDED} > ? AND $MEDIA_SELECTION",
      arrayOf(albumId, timestamp.toString(), *MEDIA_SELECTION_ARGS),
    )?.use { cursor -> cursor.count.toLong() } ?: 0L


  fun getAssetsForAlbum(albumId: String, updatedTimeCond: Long?): List<PlatformAsset> {
    var selection = "$BUCKET_SELECTION AND $MEDIA_SELECTION"
    val selectionArgs = mutableListOf(albumId, *MEDIA_SELECTION_ARGS)

    if (updatedTimeCond != null) {
      selection += " AND (${MediaStore.Files.FileColumns.DATE_MODIFIED} > ? OR ${MediaStore.Files.FileColumns.DATE_ADDED} > ?)"
      selectionArgs.addAll(listOf(updatedTimeCond.toString(), updatedTimeCond.toString()))
    }

    return getAssets(getCursor(MediaStore.VOLUME_EXTERNAL, selection, selectionArgs.toTypedArray()))
      .mapNotNull { result -> (result as? AssetResult.ValidAsset)?.asset }
      .toList()
  }

  fun hashAssets(
    assetIds: List<String>,
    // allowNetworkAccess is only used on the iOS implementation
    @Suppress("UNUSED_PARAMETER") allowNetworkAccess: Boolean,
    callback: (Result<List<HashResult>>) -> Unit
  ) {
    if (assetIds.isEmpty()) {
      completeWhenActive(callback, Result.success(emptyList()))
      return
    }

    hashTask?.cancel()
    hashTask = CoroutineScope(Dispatchers.IO).launch {
      try {
        val results = assetIds.map { assetId ->
          async {
            hashSemaphore.withPermit {
              ensureActive()
              hashAsset(assetId)
            }
          }
        }.awaitAll()

        completeWhenActive(callback, Result.success(results))
      } catch (e: CancellationException) {
        completeWhenActive(
          callback, Result.failure(
            FlutterError(
              HASHING_CANCELLED_CODE,
              "Hashing operation was cancelled",
              null
            )
          )
        )
      } catch (e: Exception) {
        completeWhenActive(callback, Result.failure(e))
      }
    }
  }

  private suspend fun hashAsset(assetId: String): HashResult {
    return try {
      val assetUri = ContentUris.withAppendedId(
        MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL),
        assetId.toLong()
      )

      val digest = MessageDigest.getInstance("SHA-1")
      ctx.contentResolver.openInputStream(assetUri)?.use { inputStream ->
        var bytesRead: Int
        val buffer = ByteArray(HASH_BUFFER_SIZE)
        while (inputStream.read(buffer).also { bytesRead = it } > 0) {
          currentCoroutineContext().ensureActive()
          digest.update(buffer, 0, bytesRead)
        }
      } ?: return HashResult(assetId, "Cannot open input stream for asset", null)

      val hashString = Base64.encodeToString(digest.digest(), Base64.NO_WRAP)
      HashResult(assetId, null, hashString)
    } catch (e: SecurityException) {
      HashResult(assetId, "Permission denied accessing asset: ${e.message}", null)
    } catch (e: Exception) {
      HashResult(assetId, "Failed to hash asset: ${e.message}", null)
    }
  }

  fun cancelHashing() {
    hashTask?.cancel()
    hashTask = null
  }

  // This method is only implemented on iOS; on Android, we do not have a concept of cloud IDs
  @Suppress("unused", "UNUSED_PARAMETER")
  fun getCloudIdForAssetIds(assetIds: List<String>): List<CloudIdResult> {
    return emptyList()
  }
}
