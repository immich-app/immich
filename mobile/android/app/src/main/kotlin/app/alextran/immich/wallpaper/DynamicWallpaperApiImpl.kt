package app.alextran.immich.wallpaper

import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class DynamicWallpaperApiImpl(private val context: Context) : DynamicWallpaperApi {
  override fun configure(assetIds: List<String>, intervalMinutes: Long, callback: (Result<Unit>) -> Unit) {
    try {
      DynamicWallpaperConfigStore.write(context, assetIds, intervalMinutes.toInt())
      ImmichWallpaperService.refreshActiveWallpapers(context)
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
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
      context.startActivity(intent)
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }

  override fun refresh(callback: (Result<Unit>) -> Unit) {
    try {
      ImmichWallpaperService.refreshActiveWallpapers(context)
      callback(Result.success(Unit))
    } catch (error: Throwable) {
      callback(Result.failure(error))
    }
  }
}
