package app.alextran.immich.sync

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import androidx.annotation.RequiresExtension
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.withPermit
import kotlinx.serialization.json.Json
import kotlin.coroutines.cancellation.CancellationException

@RequiresApi(Build.VERSION_CODES.Q)
@RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
class NativeSyncApiImpl30(context: Context) : NativeSyncApiImplBase(context), NativeSyncApi {
  private val ctx: Context = context.applicationContext
  private val prefs = ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)

  companion object {
    const val SHARED_PREF_NAME = "Immich::MediaManager"
    const val SHARED_PREF_MEDIA_STORE_VERSION_KEY = "MediaStore::getVersion"
    const val SHARED_PREF_MEDIA_STORE_GEN_KEY = "MediaStore::getGeneration"
  }

  private fun getSavedGenerationMap(): Map<String, Long> {
    return prefs.getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)?.let {
      Json.decodeFromString<Map<String, Long>>(it)
    } ?: emptyMap()
  }

  override fun clearSyncCheckpoint() {
    prefs.edit().apply {
      remove(SHARED_PREF_MEDIA_STORE_VERSION_KEY)
      remove(SHARED_PREF_MEDIA_STORE_GEN_KEY)
      apply()
    }
  }

  @RequiresExtension(extension = Build.VERSION_CODES.R, version = 1)
  @RequiresApi(Build.VERSION_CODES.R)
  override fun getTrashedAssetsForAlbum(
    albumId: String,
    updatedTimeCond: Long?
  ): List<PlatformAsset> {
    val trashed = mutableListOf<PlatformAsset>()
    val volumes = MediaStore.getExternalVolumeNames(ctx)

    var selection = "$BUCKET_SELECTION AND $MEDIA_SELECTION"
    val selectionArgs = mutableListOf(albumId, *MEDIA_SELECTION_ARGS)

    if (updatedTimeCond != null) {
      selection += " AND (${MediaStore.Files.FileColumns.DATE_MODIFIED} > ? OR ${MediaStore.Files.FileColumns.DATE_ADDED} > ?)"
      selectionArgs.addAll(listOf(updatedTimeCond.toString(), updatedTimeCond.toString()))
    }

    for (volume in volumes) {
      val uri = MediaStore.Files.getContentUri(volume)
      val queryArgs = Bundle().apply {
        putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
        putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs.toTypedArray())
        putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
      }

      ctx.contentResolver.query(uri, ASSET_PROJECTION, queryArgs, null).use { cursor ->
        getAssets(cursor).forEach { res ->
          if (res is AssetResult.ValidAsset) trashed += res.asset
        }
      }
    }
    return trashed
  }

  override fun hashTrashedAssets(
    trashedAssets: List<TrashedAssetParams>,
    callback: (Result<List<HashResult>>) -> Unit
  ) {
    if (trashedAssets.isEmpty()) {
      callback(Result.success(emptyList()))
      return
    }
    hashTask?.cancel()
    hashTask = CoroutineScope(Dispatchers.IO).launch {
      try {
        val results = trashedAssets.map { assetParams ->
          async {
            hashSemaphore.withPermit {
              ensureActive()
              hashTrashedAsset(assetParams)
            }
          }
        }.awaitAll()

        callback(Result.success(results))
      } catch (e: CancellationException) {
        callback(
          Result.failure(
            FlutterError(
              HASHING_CANCELLED_CODE,
              "Hashing operation was cancelled",
              null
            )
          )
        )
      } catch (e: Exception) {
        callback(Result.failure(e))
      }
    }
  }

  override fun shouldFullSync(): Boolean =
    MediaStore.getVersion(ctx) != prefs.getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null)

  override fun checkpointSync() {
    val genMap = MediaStore.getExternalVolumeNames(ctx)
      .associateWith { MediaStore.getGeneration(ctx, it) }

    prefs.edit().apply {
      putString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, MediaStore.getVersion(ctx))
      putString(SHARED_PREF_MEDIA_STORE_GEN_KEY, Json.encodeToString(genMap))
      apply()
    }
  }

  override fun getMediaChanges(): SyncDelta {
    val genMap = getSavedGenerationMap()
    val currentVolumes = MediaStore.getExternalVolumeNames(ctx)
    val changed = mutableListOf<PlatformAsset>()
    val deleted = mutableListOf<String>()
    val assetAlbums = mutableMapOf<String, List<String>>()
    var hasChanges = genMap.keys != currentVolumes

    for (volume in currentVolumes) {
      val currentGen = MediaStore.getGeneration(ctx, volume)
      val storedGen = genMap[volume] ?: 0
      if (currentGen <= storedGen) {
        continue
      }

      hasChanges = true

      val selection =
        "$MEDIA_SELECTION AND (${MediaStore.MediaColumns.GENERATION_MODIFIED} > ? OR ${MediaStore.MediaColumns.GENERATION_ADDED} > ?)"
      val selectionArgs = arrayOf(
        *MEDIA_SELECTION_ARGS,
        storedGen.toString(),
        storedGen.toString()
      )

      getAssets(getCursor(volume, selection, selectionArgs)).forEach {
        when (it) {
          is AssetResult.ValidAsset -> {
            changed.add(it.asset)
            assetAlbums[it.asset.id] = listOf(it.albumId)
          }

          is AssetResult.InvalidAsset -> deleted.add(it.assetId)
        }
      }
    }
    // Unmounted volumes are handled in dart when the album is removed
    return SyncDelta(hasChanges, changed, deleted, assetAlbums)
  }

  suspend fun hashTrashedAsset(assetParams: TrashedAssetParams): HashResult {
    val id = assetParams.id.toLong()
    val mediaType = assetParams.type.toInt()
    val assetUri = contentUriForType(id, mediaType)
    return hashAssetFromUri(assetParams.id, assetUri)
  }

  private fun contentUriForType(id: Long, mediaType: Int): Uri {
    val vol = MediaStore.VOLUME_EXTERNAL
    val base = when (mediaType) {
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaStore.Images.Media.getContentUri(vol)
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaStore.Video.Media.getContentUri(vol)
      MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> MediaStore.Audio.Media.getContentUri(vol)
      else -> MediaStore.Files.getContentUri(vol)
    }
    return ContentUris.withAppendedId(base, id)
  }
}
