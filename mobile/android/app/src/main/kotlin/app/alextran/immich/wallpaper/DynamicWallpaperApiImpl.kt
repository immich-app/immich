package app.alextran.immich.wallpaper

import android.app.WallpaperManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class DynamicWallpaperApiImpl(private val context: Context) : DynamicWallpaperApi {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val preparer = DynamicWallpaperPreparer(context.applicationContext)
  private val updateMutex = Mutex()

  override fun configure(assets: List<DynamicWallpaperAssetRef>, callback: (Result<DynamicWallpaperStatus>) -> Unit) {
    updateWallpapers(
      assets = assets,
      callback = callback,
      writeSelection = { DynamicWallpaperConfigStore.writeSelection(context, it) },
      prepare = { preparer.prepare(it, force = false) },
    )
  }

  override fun openLiveWallpaperPicker(callback: (Result<Unit>) -> Unit) {
    try {
      val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
        putExtra(
          WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
          ComponentName(context, ImmichWallpaperService::class.java)
        )
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(intent)
      } catch (_: ActivityNotFoundException) {
        context.startActivity(
          Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        )
      }
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }

  override fun refresh(assets: List<DynamicWallpaperAssetRef>, callback: (Result<DynamicWallpaperStatus>) -> Unit) {
    updateWallpapers(
      assets = assets,
      callback = callback,
      writeSelection = { DynamicWallpaperConfigStore.writeSelection(context, it, resetActiveIndex = false) },
      prepare = { preparer.prepare(it, force = true) },
    )
  }

  override fun updateSelection(
    assets: List<DynamicWallpaperAssetRef>,
    forcePrepareIds: List<String>,
    prepareMissing: Boolean,
    callback: (Result<DynamicWallpaperStatus>) -> Unit,
  ) {
    val forcePrepareIdSet = forcePrepareIds.toSet()
    updateWallpapers(
      assets = assets,
      callback = callback,
      normalize = {
        if (prepareMissing) {
          DynamicWallpaperRotation.deduplicateRefsPreservingOrder(it)
        } else {
          DynamicWallpaperConfigStore.refsPreservingSourceMetadata(context, it)
        }
      },
      writeSelection = { DynamicWallpaperConfigStore.writeSelectionPreservingActiveAsset(context, it) },
      prepare = {
        if (prepareMissing || forcePrepareIdSet.isNotEmpty()) {
          preparer.prepare(
            it,
            force = false,
            forcePrepareIds = forcePrepareIdSet,
            prepareMissing = prepareMissing,
          )
        } else {
          DynamicWallpaperConfigStore.status(context)
        }
      },
    )
  }

  override fun disable(callback: (Result<Unit>) -> Unit) {
    try {
      val wallpaperManager = WallpaperManager.getInstance(context)
      if (DynamicWallpaperConfigStore.isImmichLiveWallpaperEnabled(context)) {
        wallpaperManager.clear(WallpaperManager.FLAG_SYSTEM)
        wallpaperManager.clear(WallpaperManager.FLAG_LOCK)
      }
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }

  override fun getStatus(callback: (Result<DynamicWallpaperStatus>) -> Unit) {
    try {
      DynamicWallpaperConfigStore.migrateIfNeeded(context)
      callback(Result.success(DynamicWallpaperConfigStore.status(context)))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }

  private fun updateWallpapers(
    assets: List<DynamicWallpaperAssetRef>,
    callback: (Result<DynamicWallpaperStatus>) -> Unit,
    normalize: (List<DynamicWallpaperAssetRef>) -> List<DynamicWallpaperAssetRef> =
      DynamicWallpaperRotation::deduplicateRefsPreservingOrder,
    writeSelection: (List<DynamicWallpaperAssetRef>) -> Unit,
    prepare: suspend (List<DynamicWallpaperAssetRef>) -> DynamicWallpaperStatus,
  ) {
    scope.launch {
      try {
        val status = updateMutex.withLock {
          DynamicWallpaperConfigStore.migrateIfNeeded(context)
          val normalizedAssets = normalize(assets)
          writeSelection(normalizedAssets)
          val nextStatus = prepare(normalizedAssets)
          ImmichWallpaperService.refreshActiveWallpapers()
          nextStatus
        }
        callback(Result.success(status))
      } catch (error: Throwable) {
        callback(Result.failure(error))
      }
    }
  }
}
