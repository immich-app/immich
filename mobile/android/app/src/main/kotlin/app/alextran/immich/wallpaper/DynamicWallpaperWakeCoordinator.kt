package app.alextran.immich.wallpaper

internal class DynamicWallpaperWakeCoordinator(private val debounceMs: Long = 1_000L) {
  private var pendingWakeRotation = false
  private var rotatedInWakeCycle = false
  private var lastRotationElapsed: Long? = null

  fun onWakeSignal(hasVisibleWallpaper: Boolean, nowElapsed: Long): Boolean {
    pendingWakeRotation = true
    return consumePendingIfVisible(hasVisibleWallpaper, nowElapsed)
  }

  fun onWallpaperVisible(nowElapsed: Long): Boolean {
    return consumePendingIfVisible(true, nowElapsed)
  }

  fun onScreenOff() {
    pendingWakeRotation = false
    rotatedInWakeCycle = false
  }

  private fun consumePendingIfVisible(hasVisibleWallpaper: Boolean, nowElapsed: Long): Boolean {
    if (!hasVisibleWallpaper || !pendingWakeRotation) {
      return false
    }

    pendingWakeRotation = false
    if (rotatedInWakeCycle) {
      return false
    }

    val lastRotation = lastRotationElapsed
    if (lastRotation != null && nowElapsed - lastRotation < debounceMs) {
      return false
    }

    rotatedInWakeCycle = true
    lastRotationElapsed = nowElapsed
    return true
  }
}
