package app.alextran.immich.wallpaper

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import app.alextran.immich.R
import app.alextran.immich.widget.ImmichAPI
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.Collections

class ImmichWallpaperService : WallpaperService() {
  companion object {
    private val activeEngines = Collections.synchronizedSet(mutableSetOf<WallpaperEngine>())

    fun refreshActiveWallpapers() {
      val engines = synchronized(activeEngines) { activeEngines.toList() }
      engines.forEach { it.refreshNow() }
    }
  }

  override fun onCreateEngine(): Engine {
    return WallpaperEngine()
  }

  inner class WallpaperEngine : Engine() {
    private val handler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    private var refreshJob: Job? = null
    private var visible = false

    private val refreshRunnable = object : Runnable {
      override fun run() {
        refreshNow()
      }
    }

    override fun onCreate(surfaceHolder: SurfaceHolder) {
      super.onCreate(surfaceHolder)
      activeEngines.add(this)
    }

    override fun onVisibilityChanged(visible: Boolean) {
      this.visible = visible
      if (visible) {
        refreshNow()
      } else {
        handler.removeCallbacks(refreshRunnable)
      }
    }

    override fun onSurfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
      super.onSurfaceChanged(holder, format, width, height)
      drawCachedOrFallback()
    }

    override fun onDestroy() {
      activeEngines.remove(this)
      handler.removeCallbacks(refreshRunnable)
      refreshJob?.cancel()
      scope.cancel()
      super.onDestroy()
    }

    fun refreshNow() {
      refreshJob?.cancel()
      refreshJob = scope.launch {
        updateWallpaper()
      }
      scheduleNext()
    }

    private fun scheduleNext() {
      handler.removeCallbacks(refreshRunnable)
      if (!visible) {
        return
      }

      val intervalMinutes = DynamicWallpaperConfigStore.read(applicationContext).intervalMinutes
      handler.postDelayed(refreshRunnable, intervalMinutes * 60_000L)
    }

    private suspend fun updateWallpaper() {
      val config = DynamicWallpaperConfigStore.read(applicationContext)
      val assetIds = config.assetIds

      if (assetIds.isEmpty()) {
        drawCachedOrFallback()
        return
      }

      val serverConfig = ImmichAPI.getServerConfig(applicationContext)
      if (serverConfig == null) {
        drawCachedOrFallback()
        return
      }

      val index = config.nextIndex % assetIds.size
      val assetId = assetIds[index]

      try {
        val bitmap = ImmichAPI(serverConfig).fetchImage(assetId)
        saveCache(bitmap)
        DynamicWallpaperConfigStore.writeNextIndex(applicationContext, (index + 1) % assetIds.size)
        drawBitmap(bitmap)
      } catch (_: Exception) {
        drawCachedOrFallback()
      }
    }

    private fun drawCachedOrFallback() {
      val cached = loadCache()
      if (cached != null) {
        drawBitmap(cached)
      } else {
        drawFallback()
      }
    }

    private fun drawBitmap(bitmap: Bitmap) {
      val holder = surfaceHolder
      if (!holder.surface.isValid) {
        return
      }

      val canvas = runCatching { holder.lockCanvas() }.getOrNull() ?: return
      try {
        drawCenterCrop(canvas, bitmap)
      } finally {
        holder.unlockCanvasAndPost(canvas)
      }
    }

    private fun drawFallback() {
      val fallback = BitmapFactory.decodeResource(resources, R.drawable.splash)
      if (fallback != null) {
        drawBitmap(fallback)
      }
    }

    private fun drawCenterCrop(canvas: Canvas, bitmap: Bitmap) {
      canvas.drawColor(android.graphics.Color.BLACK)

      val canvasWidth = canvas.width
      val canvasHeight = canvas.height
      if (canvasWidth <= 0 || canvasHeight <= 0 || bitmap.width <= 0 || bitmap.height <= 0) {
        return
      }

      val scale = maxOf(
        canvasWidth.toFloat() / bitmap.width.toFloat(),
        canvasHeight.toFloat() / bitmap.height.toFloat(),
      )
      val targetWidth = (bitmap.width * scale).toInt()
      val targetHeight = (bitmap.height * scale).toInt()
      val left = (canvasWidth - targetWidth) / 2
      val top = (canvasHeight - targetHeight) / 2

      val src = Rect(0, 0, bitmap.width, bitmap.height)
      val dst = Rect(left, top, left + targetWidth, top + targetHeight)
      canvas.drawBitmap(bitmap, src, dst, paint)
    }

    private fun loadCache(): Bitmap? {
      val file = cacheFile()
      if (!file.exists()) {
        return null
      }

      return BitmapFactory.decodeFile(file.absolutePath)
    }

    private suspend fun saveCache(bitmap: Bitmap) = withContext(Dispatchers.IO) {
      FileOutputStream(cacheFile()).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
      }
    }

    private fun cacheFile(): File {
      return File(applicationContext.cacheDir, kDynamicWallpaperImageFilename)
    }
  }
}
