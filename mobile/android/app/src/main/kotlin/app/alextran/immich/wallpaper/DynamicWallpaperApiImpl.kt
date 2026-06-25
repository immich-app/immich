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

  override fun configure(assetIds: List<String>, callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        val normalizedAssetIds = DynamicWallpaperRotation.deduplicatePreservingOrder(assetIds)
        DynamicWallpaperConfigStore.writeSelection(context, normalizedAssetIds)
        preparer.prepare(normalizedAssetIds, force = false)
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

  override fun refresh(callback: (Result<Unit>) -> Unit) {
    scope.launch {
      try {
        preparer.prepare(DynamicWallpaperConfigStore.read(context).assetIds, force = true)
        ImmichWallpaperService.refreshActiveWallpapers()
        callback(Result.success(Unit))
      } catch (error: Throwable) {
        callback(Result.failure(error))
      }
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
