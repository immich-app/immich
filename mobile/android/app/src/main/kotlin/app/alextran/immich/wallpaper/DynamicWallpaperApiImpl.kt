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

class DynamicWallpaperApiImpl(private val context: Context) : DynamicWallpaperApi {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val preparer = DynamicWallpaperPreparer(context.applicationContext)

  override fun configure(assets: List<DynamicWallpaperAssetRef>, callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        val normalizedAssets = DynamicWallpaperRotation.deduplicateRefsPreservingOrder(assets)
        DynamicWallpaperConfigStore.writeSelection(context, normalizedAssets)
        preparer.prepare(normalizedAssets, force = false)
        ImmichWallpaperService.refreshActiveWallpapers()
        callback(Result.success(Unit))
      } catch (error: Throwable) {
        callback(Result.failure(error))
      }
    }
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

  override fun refresh(assets: List<DynamicWallpaperAssetRef>, callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        val normalizedAssets = DynamicWallpaperRotation.deduplicateRefsPreservingOrder(assets)
        DynamicWallpaperConfigStore.writeSelection(context, normalizedAssets, resetActiveIndex = false)
        preparer.prepare(normalizedAssets, force = true)
        ImmichWallpaperService.refreshActiveWallpapers()
        callback(Result.success(Unit))
      } catch (error: Throwable) {
        callback(Result.failure(error))
      }
    }
  }

  override fun updateSelection(
    assets: List<DynamicWallpaperAssetRef>,
    forcePrepareIds: List<String>,
    prepareMissing: Boolean,
    callback: (Result<Unit>) -> Unit,
  ) {
    scope.launch {
      try {
        val normalizedAssets = if (prepareMissing) {
          DynamicWallpaperRotation.deduplicateRefsPreservingOrder(assets)
        } else {
          DynamicWallpaperConfigStore.refsPreservingSourceMetadata(context, assets)
        }

        DynamicWallpaperConfigStore.writeSelectionPreservingActiveAsset(context, normalizedAssets)

        val forcePrepareIdSet = forcePrepareIds.toSet()
        if (prepareMissing || forcePrepareIdSet.isNotEmpty()) {
          preparer.prepare(
            normalizedAssets,
            force = false,
            forcePrepareIds = forcePrepareIdSet,
            prepareMissing = prepareMissing,
          )
        }

        ImmichWallpaperService.refreshActiveWallpapers()
        callback(Result.success(Unit))
      } catch (error: Throwable) {
        callback(Result.failure(error))
      }
    }
  }

  override fun disable(callback: (Result<Unit>) -> Unit) {
    try {
      val wallpaperManager = WallpaperManager.getInstance(context)
      wallpaperManager.clear(WallpaperManager.FLAG_SYSTEM)
      wallpaperManager.clear(WallpaperManager.FLAG_LOCK)
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }

  override fun getStatus(callback: (Result<DynamicWallpaperStatus>) -> Unit) {
    try {
      callback(Result.success(DynamicWallpaperConfigStore.status(context)))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }
}
