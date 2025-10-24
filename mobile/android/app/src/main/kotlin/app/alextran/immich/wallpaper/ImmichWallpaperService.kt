package app.alextran.immich.wallpaper

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.net.ConnectivityManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.util.Log
import android.view.SurfaceHolder
import androidx.core.content.getSystemService
import app.alextran.immich.widget.ImmichAPI
import app.alextran.immich.widget.model.SearchFilters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.math.max

class ImmichWallpaperService : WallpaperService() {
  override fun onCreateEngine(): Engine {
    return ImmichWallpaperEngine()
  }

  private inner class ImmichWallpaperEngine : Engine(), SharedPreferences.OnSharedPreferenceChangeListener {

    private val appContext: Context = this@ImmichWallpaperService.applicationContext

    private val store = WallpaperPreferencesStore(appContext)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val handler = Handler(Looper.getMainLooper())
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val previewFile = File(appContext.filesDir, "immich_wallpaper_preview.jpg")

    private var isVisibleToUser = false
    private var lastRefreshToken = store.getRefreshToken()
    private var refreshJob: Job? = null

    private val refreshRunnable = Runnable { refreshWallpaper() }

    override fun onCreate(surfaceHolder: SurfaceHolder) {
      super.onCreate(surfaceHolder)
      setTouchEventsEnabled(false)
      store.registerListener(this)
      refreshWallpaper(force = true)
    }

    override fun onDestroy() {
      handler.removeCallbacks(refreshRunnable)
      store.unregisterListener(this)
      refreshJob?.cancel()
      refreshJob = null
      scope.cancel()
      super.onDestroy()
    }

    override fun onVisibilityChanged(visible: Boolean) {
      val wasVisible = isVisibleToUser
      isVisibleToUser = visible
      
      if (visible) {
        val preferences = store.getPreferences()
        if (preferences?.rotationMode == "lockUnlock" && !wasVisible) {
          // Only refresh for lock/unlock mode when becoming visible after being hidden
          Log.d(TAG, "Refreshing wallpaper on unlock (lockUnlock mode)")
          refreshWallpaper(force = true)
        } else if (preferences?.rotationMode != "lockUnlock") {
          // For other modes, just resume regular scheduling without forcing refresh
          Log.d(TAG, "Resuming wallpaper rotation (${preferences?.rotationMode} mode)")
          refreshWallpaper(force = false)
        }
      } else {
        Log.d(TAG, "Wallpaper service hidden")
        handler.removeCallbacks(refreshRunnable)
        refreshJob?.cancel()
        refreshJob = null
      }
    }

    override fun onSurfaceDestroyed(holder: SurfaceHolder) {
      handler.removeCallbacks(refreshRunnable)
      refreshJob?.cancel()
      refreshJob = null
      super.onSurfaceDestroyed(holder)
    }

    override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences, key: String?) {
      when (key) {
        KEY_ENABLED, KEY_ROTATION_MINUTES, KEY_ROTATION_MODE, KEY_PERSON_IDS, KEY_ALLOW_CELLULAR -> refreshWallpaper(force = true)
        KEY_REFRESH_TOKEN -> {
          val nextToken = store.getRefreshToken()
          if (nextToken != lastRefreshToken) {
            lastRefreshToken = nextToken
            refreshWallpaper(force = true)
          }
        }
      }
    }

    private fun refreshWallpaper(force: Boolean = false) {
      if (!isVisibleToUser && !force) {
        return
      }

      val preferences = store.getPreferences()
      if (preferences == null || !preferences.enabled) {
        handler.removeCallbacks(refreshRunnable)
        return
      }

      // Check if we should fetch a new image or just show cached
      val shouldFetchNew = force || shouldFetchNewImage(preferences)
      Log.d(TAG, "refreshWallpaper: force=$force, shouldFetchNew=$shouldFetchNew, mode=${preferences.rotationMode}")

      refreshJob?.cancel()
      refreshJob = scope.launch {
        val cached = withContext(Dispatchers.IO) { loadCachedBitmap() }
        if (cached != null) {
          drawBitmap(WallpaperImageResult(cached))
          cached.recycle()
        }

        // Only fetch new image if needed
        if (!shouldFetchNew) {
          Log.d(TAG, "Using cached image, not fetching new wallpaper")
          scheduleNext(preferences)
          return@launch
        }

        if (!preferences.allowCellularData && isActiveNetworkMetered()) {
          store.setLastError("Waiting for Wi‑Fi to download wallpaper")
          scheduleNext(preferences)
          return@launch
        }

        try {
          Log.d(TAG, "Fetching new wallpaper image")
          val result = withContext(Dispatchers.IO) { fetchNext(preferences) }
          if (result != null) {
            drawBitmap(result)
            store.setLastError(null)
            result.bitmap.recycle()
          }
        } catch (error: Exception) {
          Log.e(TAG, "Failed to update wallpaper", error)
          store.setLastError(error.message ?: "Unknown error")
        } finally {
          scheduleNext(preferences)
        }
      }
    }

    private fun scheduleNext(preferences: WallpaperPreferencesMessage) {
      handler.removeCallbacks(refreshRunnable)
      if (!isVisibleToUser) {
        Log.d(TAG, "Not scheduling next refresh - service not visible")
        return
      }
      
      // Don't schedule for lock/unlock mode - it will be handled by visibility changes
      if (preferences.rotationMode == "lockUnlock") {
        Log.d(TAG, "Not scheduling next refresh - using lockUnlock mode")
        return
      }
      
      val delayMs = when (preferences.rotationMode) {
        "minutes" -> preferences.rotationMinutes * 60_000L
        "hours" -> preferences.rotationMinutes * 60_000L * 60L
        "daily" -> 24L * 60L * 60L * 1000L
        else -> max(preferences.rotationMinutes, 1L) * 60_000L
      }
      
      Log.d(TAG, "Scheduling next wallpaper refresh in ${delayMs / 1000}s (mode: ${preferences.rotationMode})")
      handler.postDelayed(refreshRunnable, delayMs)
    }

    private fun shouldFetchNewImage(preferences: WallpaperPreferencesMessage): Boolean {
      // Always fetch for lock/unlock mode
      if (preferences.rotationMode == "lockUnlock") {
        return true
      }

      val lastRefreshAt = store.getLastRefreshAt()
      if (lastRefreshAt == 0L) {
        // No previous refresh, fetch new image
        return true
      }

      val currentTime = System.currentTimeMillis()
      val timeSinceLastRefresh = currentTime - lastRefreshAt

      val rotationIntervalMs = when (preferences.rotationMode) {
        "minutes" -> preferences.rotationMinutes * 60_000L
        "hours" -> preferences.rotationMinutes * 60_000L * 60L
        "daily" -> 24L * 60L * 60L * 1000L
        else -> max(preferences.rotationMinutes, 1L) * 60_000L
      }

      Log.d(TAG, "Time since last refresh: ${timeSinceLastRefresh / 1000}s, interval: ${rotationIntervalMs / 1000}s")
      return timeSinceLastRefresh >= rotationIntervalMs
    }

    private fun isActiveNetworkMetered(): Boolean {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        return false
      }

      val connectivity = appContext.getSystemService<ConnectivityManager>()
      return connectivity?.isActiveNetworkMetered == true
    }

    private fun cacheBitmap(bitmap: Bitmap) {
      runCatching {
        FileOutputStream(previewFile).use { output ->
          if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 85, output)) {
            throw IOException("Failed to compress bitmap")
          }
          output.flush()
        }
      }.onFailure { error ->
        Log.w(TAG, "Failed to cache wallpaper preview", error)
      }
    }

    private fun loadCachedBitmap(): Bitmap? {
      if (!previewFile.exists() || previewFile.length() == 0L) {
        return null
      }

      return runCatching { BitmapFactory.decodeFile(previewFile.absolutePath) }.getOrNull()
    }

    private suspend fun fetchNext(preferences: WallpaperPreferencesMessage): WallpaperImageResult? {
      val config = ImmichAPI.getServerConfig(appContext)
        ?: throw IllegalStateException("Open the app to link your server first")

      val api = ImmichAPI(config)

      if (preferences.personIds.isNotEmpty()) {
        val shuffledIds = preferences.personIds.shuffled()
        for (personId in shuffledIds) {
          val result = fetchForPerson(api, personId)
          if (result != null) {
            return result
          }
        }
        throw IllegalStateException("Couldn't find any photos for the selected people")
      }

      return fetchForPerson(api, null)
        ?: throw IllegalStateException("Couldn't find any photos in your library yet")
    }

    private suspend fun fetchForPerson(api: ImmichAPI, personId: String?): WallpaperImageResult? {
      val filters = SearchFilters()
      if (personId != null) {
        filters.personIds = listOf(personId)
        filters.withPeople = true
      }

      val assets = api.fetchSearchResults(filters)
      if (assets.isEmpty()) {
        return null
      }

      val asset = assets.random()
      val bitmap = api.fetchImage(asset)
      cacheBitmap(bitmap)
      store.setLastAssetId(asset.id)
      return WallpaperImageResult(bitmap)
    }

    private fun drawBitmap(result: WallpaperImageResult) {
      val holder = surfaceHolder ?: return
      var canvas: Canvas? = null
      try {
        canvas = holder.lockCanvas()
        if (canvas != null) {
          val bitmap = result.bitmap
          canvas.drawColor(Color.BLACK)

          val scale = max(
            canvas.width.toFloat() / bitmap.width,
            canvas.height.toFloat() / bitmap.height
          )
          val dx = (canvas.width - bitmap.width * scale) / 2f
          val dy = (canvas.height - bitmap.height * scale) / 2f
          val matrix = Matrix().apply {
            postScale(scale, scale)
            postTranslate(dx, dy)
          }

          canvas.drawBitmap(bitmap, matrix, paint)
        }
      } finally {
        if (canvas != null) {
          holder.unlockCanvasAndPost(canvas)
        }
      }
    }
  }

  private data class WallpaperImageResult(val bitmap: android.graphics.Bitmap)

  companion object {
    private const val TAG = "ImmichWallpaperService"
  }
}
