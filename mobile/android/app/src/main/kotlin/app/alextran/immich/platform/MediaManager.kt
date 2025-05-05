package app.alextran.immich.platform

import Asset
import SyncDelta
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import android.provider.MediaStore.VOLUME_EXTERNAL
import androidx.annotation.RequiresApi
import androidx.annotation.RequiresExtension
import androidx.core.content.edit
import kotlinx.serialization.json.Json
import java.io.File
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

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
  fun shouldFullSync(callback: (Result<Boolean>) -> Unit) {
    val currVersion = MediaStore.getVersion(ctx)
    val lastVersion = ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
      .getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null)
    callback(Result.success(currVersion != lastVersion))
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  fun hasMediaChanges(callback: (Result<Boolean>) -> Unit) {
    val genMap = getSavedGenerationMap(ctx)
    val currentVolumes = MediaStore.getExternalVolumeNames(ctx)
    if (currentVolumes != genMap.keys) {
      callback(Result.success(true))
      return
    }

    val hasChanged = currentVolumes.any { volume ->
      val currentGen = MediaStore.getGeneration(ctx, volume)
      currentGen != genMap[volume]
    }
    callback(Result.success(hasChanged))
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  fun checkpointSync(callback: (Result<Unit>) -> Unit) {
    val genMap = MediaStore.getExternalVolumeNames(ctx).associateWith {
      MediaStore.getGeneration(ctx, it)
    }.let { Json.encodeToString(it) }

    ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE).edit {
      putString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, MediaStore.getVersion(ctx))
      putString(SHARED_PREF_MEDIA_STORE_GEN_KEY, genMap)
    }
    callback(Result.success(Unit))
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  fun getAssetIdsForAlbum(
    albumId: String,
    callback: (Result<List<String>>) -> Unit
  ) {
    try {
      val currentIds = mutableListOf<String>()
      val uri = MediaStore.Files.getContentUri(VOLUME_EXTERNAL)
      val projection = arrayOf(MediaStore.Files.FileColumns._ID)
      val selection = """
            ${MediaStore.Files.FileColumns.BUCKET_ID} = ?
            AND (
                ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?
                OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?
            )
        """.trimIndent()
      val selectionArgs = arrayOf(
        albumId,
        MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
        MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
      )
      val sortOrder = null

      ctx.contentResolver.query(
        uri,
        projection,
        selection,
        selectionArgs,
        sortOrder
      )?.use { cursor ->
        val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
        while (cursor.moveToNext()) {
          currentIds.add(cursor.getLong(idColumn).toString())
        }
      }

      callback(Result.success(currentIds))
    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  fun getMediaChanges(callback: (Result<SyncDelta>) -> Unit) {
    try {
      val genMap = getSavedGenerationMap(ctx)
      val currentVolumes = MediaStore.getExternalVolumeNames(ctx)
      val changed = mutableListOf<Asset>()
      val deleted = mutableListOf<String>()

      for (volume in currentVolumes) {
        val currentGen = MediaStore.getGeneration(ctx, volume)
        val storedGen = genMap[volume]

        if (storedGen != null && currentGen < storedGen) {
          continue
        }

        val queryUri = MediaStore.Files.getContentUri(volume)
        val projection = arrayOf(
          MediaStore.MediaColumns._ID,
          MediaStore.MediaColumns.DATA,
          MediaStore.MediaColumns.DISPLAY_NAME,
          MediaStore.MediaColumns.TITLE,
          MediaStore.Files.FileColumns.MEDIA_TYPE,
          MediaStore.MediaColumns.BUCKET_ID,
          MediaStore.MediaColumns.DURATION,
          MediaStore.MediaColumns.DATE_TAKEN,
          MediaStore.MediaColumns.DATE_ADDED,
          MediaStore.MediaColumns.DATE_MODIFIED,
        )

        val selectionParts = mutableListOf<String>()
        val selectionArgsList = mutableListOf<String>()

        selectionParts.add(
          "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"
        )
        selectionArgsList.add(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString())
        selectionArgsList.add(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString())

        if (storedGen != null) {
          selectionParts.add(
            "(${MediaStore.MediaColumns.GENERATION_MODIFIED} > ? OR ${MediaStore.MediaColumns.GENERATION_ADDED} > ?)"
          )
          selectionArgsList.add(storedGen.toString())
          selectionArgsList.add(storedGen.toString())
        }

        val selection = selectionParts.joinToString(" AND ")
        val selectionArgs = selectionArgsList.toTypedArray()
        val sortOrder = null

        ctx.contentResolver.query(
          queryUri,
          projection,
          selection,
          selectionArgs,
          sortOrder
        )?.use { cursor ->
          val idColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
          val mediaTypeColumn =
            cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
          val nameColumn =
            cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
          val dataColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA)
          val dateTakeColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_TAKEN)
          val dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
          val dateModifiedColumn =
            cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)
          val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)
          val bucketIdColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_ID)
          val formatter = DateTimeFormatter.ISO_DATE_TIME.withZone(ZoneOffset.UTC)

          while (cursor.moveToNext()) {
            val id = cursor.getLong(idColumn).toString()
            val path = cursor.getString(dataColumn)
            if (path.isBlank() || !File(path).exists()) {
              deleted.add(id)
              continue
            }

            val mediaType = cursor.getInt(mediaTypeColumn)
            val name = cursor.getString(nameColumn)
            // Date taken is milliseconds since epoch
            var takenAt = cursor.getLong(dateTakeColumn)
            if (takenAt == 0L) {
              // Date added is seconds since epoch
              takenAt = cursor.getLong(dateAddedColumn) * 1000
            }
            val takenInstant = Instant.ofEpochMilli(takenAt)
            val createdAt = formatter.format(takenInstant)
            // Date modified is seconds since epoch
            val modifiedAt =
              formatter.format(Instant.ofEpochMilli(cursor.getLong(dateModifiedColumn) * 1000))
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
      val syncDelta = SyncDelta(updates = changed, deletes = deleted)
      callback(Result.success(syncDelta))

    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }
}
