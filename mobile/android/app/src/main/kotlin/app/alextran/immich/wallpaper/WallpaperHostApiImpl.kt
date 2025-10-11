package app.alextran.immich.wallpaper

import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

class WallpaperHostApiImpl(private val context: Context) : WallpaperHostApi {
  private val store = WallpaperPreferencesStore(context)

  override fun getStatus(): WallpaperStatusMessage {
    val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
      context.packageManager.hasSystemFeature(PackageManager.FEATURE_LIVE_WALLPAPER)
    val manager = WallpaperManager.getInstance(context)
    val component = ComponentName(context, ImmichWallpaperService::class.java)
    val isActive = runCatching { manager.wallpaperInfo?.component == component }.getOrDefault(false)

    return WallpaperStatusMessage(
      isSupported = supported,
      isActive = isActive,
      lastError = store.getLastError()
    )
  }

  override fun setPreferences(preferences: WallpaperPreferencesMessage) {
    store.save(preferences)
    if (!preferences.enabled) {
      store.setLastError(null)
    }
  }

  override fun requestRefresh() {
    store.bumpRefreshToken()
  }

  override fun openSystemWallpaperPicker(): Boolean {
    val component = ComponentName(context, ImmichWallpaperService::class.java)
    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
      Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
        putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, component)
      }
    } else {
      Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER)
    }.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }

    return runCatching { context.startActivity(intent) }.isSuccess
  }
}
