package app.alextran.immich.sync

import android.content.ContentResolver
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import androidx.annotation.RequiresExtension
import kotlinx.serialization.json.Json

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

  override fun getTrashedAssets(): Map<String, List<PlatformAsset>> {

    val result = LinkedHashMap<String, MutableList<PlatformAsset>>()
    val volumes = MediaStore.getExternalVolumeNames(ctx)

    for (volume in volumes) {

      val queryArgs = Bundle().apply {
        putString(ContentResolver.QUERY_ARG_SQL_SELECTION, MEDIA_SELECTION)
        putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, MEDIA_SELECTION_ARGS)
        putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
      }

      getCursor(volume, queryArgs).use { cursor ->
        getAssets(cursor).forEach { res ->
          if (res is AssetResult.ValidAsset) {
            result.getOrPut(res.albumId) { mutableListOf() }.add(res.asset)
          }
        }
      }
    }

    return result.mapValues { it.value.toList() }
  }
}
