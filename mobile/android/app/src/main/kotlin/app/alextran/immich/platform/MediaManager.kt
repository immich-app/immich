package app.alextran.immich.platform

import Asset
import SyncDelta
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import androidx.annotation.RequiresExtension
import kotlinx.serialization.json.Json
import java.io.File

class MediaManager(context: Context) {
  private val ctx: Context = context.applicationContext

  companion object {
    private const val SHARED_PREF_NAME = "Immich::MediaManager"
    private const val SHARED_PREF_MEDIA_STORE_VERSION_KEY = "MediaStore::getVersion"
    private const val SHARED_PREF_MEDIA_STORE_GEN_KEY = "MediaStore::getGeneration"

    private fun getSavedGenerationMap(context: Context): Map<String, Long> {
      return context.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
        .getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)?.let {
          Json.decodeFromString<Map<String, Long>>(it)
        } ?: emptyMap()
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  fun shouldFullSync(): Boolean {
    val prefs = ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
    return MediaStore.getVersion(ctx) != prefs.getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null)
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  fun checkpointSync() {
    val genMap =
      MediaStore.getExternalVolumeNames(ctx).associateWith { MediaStore.getGeneration(ctx, it) }
    ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE).edit().apply {
      putString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, MediaStore.getVersion(ctx))
      putString(SHARED_PREF_MEDIA_STORE_GEN_KEY, Json.encodeToString(genMap))
      apply()
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  fun getAssetIdsForAlbum(albumId: String): List<String> {
    val uri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)
    val selection =
      "${MediaStore.Files.FileColumns.BUCKET_ID} = ? AND (${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"
    val selectionArgs = arrayOf(
      albumId,
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
    )

    return ctx.contentResolver.query(uri, projection, selection, selectionArgs, null)
      ?.use { cursor ->
        val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
        generateSequence {
          if (cursor.moveToNext()) cursor.getLong(idColumn).toString() else null
        }.toList()
      } ?: emptyList()
  }

  @RequiresApi(Build.VERSION_CODES.R)
  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  fun getMediaChanges(): SyncDelta {
    val genMap = getSavedGenerationMap(ctx)
    val currentVolumes = MediaStore.getExternalVolumeNames(ctx)
    val changed = mutableListOf<Asset>()
    val deleted = mutableListOf<String>()

    var hasChanges = genMap.keys != currentVolumes
    for (volume in currentVolumes) {
      val currentGen = MediaStore.getGeneration(ctx, volume)
      val storedGen = genMap[volume]
      if (storedGen != null && currentGen <= storedGen) {
        continue
      }
      hasChanges = true

      val uri = MediaStore.Files.getContentUri(volume)
      val projection = arrayOf(
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

      val selection =
        "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?) AND (${MediaStore.MediaColumns.GENERATION_MODIFIED} > ? OR ${MediaStore.MediaColumns.GENERATION_ADDED} > ?)"
      val selectionArgs = arrayOf(
        MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
        MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString(),
        storedGen?.toString() ?: "0",
        storedGen?.toString() ?: "0"
      )

      ctx.contentResolver.query(
        uri,
        projection,
        selection,
        selectionArgs,
        null
      )?.use { cursor ->
        val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
        val dataColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA)
        val nameColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
        val dateTakenColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_TAKEN)
        val dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
        val dateModifiedColumn =
          cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)
        val mediaTypeColumn =
          cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
        val bucketIdColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_ID)
        val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)

        while (cursor.moveToNext()) {
          val id = cursor.getLong(idColumn).toString()
          val path = cursor.getString(dataColumn)
          if (path.isBlank() || !File(path).exists()) {
            deleted.add(id)
            continue
          }

          val mediaType = cursor.getInt(mediaTypeColumn)
          val name = cursor.getString(nameColumn)
          // Date taken is milliseconds since epoch, Date added is seconds since epoch
          val createdAt = (cursor.getLong(dateTakenColumn).takeIf { it > 0 }?.div(1000))
            ?: cursor.getLong(dateAddedColumn)
          // Date modified is seconds since epoch
          val modifiedAt = cursor.getLong(dateModifiedColumn) * 1000
          // Duration is milliseconds
          val duration =
            if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) 0 else cursor.getLong(
              durationColumn
            ) / 1000
          val bucketId = cursor.getString(bucketIdColumn)

          changed.add(
            Asset(
              id,
              name,
              mediaType.toLong(),
              createdAt,
              modifiedAt,
              duration,
              listOf(bucketId)
            )
          )
        }
      }
    }
    // Unmounted volumes are handled in dart when the album is removed

    return SyncDelta(hasChanges, changed, deleted)
  }
}
