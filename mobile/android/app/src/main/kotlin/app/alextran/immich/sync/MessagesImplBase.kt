package app.alextran.immich.sync

import android.annotation.SuppressLint
import android.content.Context
import android.database.Cursor
import android.provider.MediaStore
import java.io.File

sealed class AssetResult {
  data class ValidAsset(val asset: ImAsset, val albumId: String) : AssetResult()
  data class InvalidAsset(val assetId: String) : AssetResult()
}

@SuppressLint("InlinedApi")
open class NativeSyncApiImplBase(context: Context) {
  private val ctx: Context = context.applicationContext

  companion object {
    const val MEDIA_SELECTION =
      "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"
    val MEDIA_SELECTION_ARGS = arrayOf(
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
    )
    const val BUCKET_SELECTION = "(${MediaStore.Files.FileColumns.BUCKET_ID} = ?)"
    val ASSET_PROJECTION = arrayOf(
      MediaStore.MediaColumns._ID,
      MediaStore.MediaColumns.DATA,
      MediaStore.MediaColumns.DISPLAY_NAME,
      MediaStore.MediaColumns.DATE_TAKEN,
      MediaStore.MediaColumns.DATE_ADDED,
      MediaStore.MediaColumns.DATE_MODIFIED,
      MediaStore.Files.FileColumns.MEDIA_TYPE,
      MediaStore.MediaColumns.BUCKET_ID,
      MediaStore.MediaColumns.DURATION
    )
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
        val durationColumn = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)

        while (c.moveToNext()) {
          val id = c.getLong(idColumn).toString()

          val path = c.getString(dataColumn)
          if (path.isNullOrBlank() || !File(path).exists()) {
            yield(AssetResult.InvalidAsset(id))
            continue
          }

          val mediaType = c.getInt(mediaTypeColumn)
          val name = c.getString(nameColumn)
          // Date taken is milliseconds since epoch, Date added is seconds since epoch
          val createdAt = (c.getLong(dateTakenColumn).takeIf { it > 0 }?.div(1000))
            ?: c.getLong(dateAddedColumn)
          // Date modified is seconds since epoch
          val modifiedAt = c.getLong(dateModifiedColumn)
          // Duration is milliseconds
          val duration = if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) 0
          else c.getLong(durationColumn) / 1000
          val bucketId = c.getString(bucketIdColumn)

          val asset = ImAsset(id, name, mediaType.toLong(), createdAt, modifiedAt, duration)
          yield(AssetResult.ValidAsset(asset, bucketId))
        }
      }
    }
  }

  fun getAlbums(): List<ImAlbum> {
    val albums = mutableListOf<ImAlbum>()
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

        val name = cursor.getString(bucketNameColumn)
        val updatedAt = cursor.getLong(dateModified)
        albums.add(ImAlbum(id, name, updatedAt, false, 0))
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


  fun getAssetsForAlbum(albumId: String, updatedTimeCond: Long?): List<ImAsset> {
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
}
