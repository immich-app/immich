package app.alextran.immich.wallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.os.Build
import android.os.SystemClock
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import app.alextran.immich.R
import app.alextran.immich.widget.ImmichAPI
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.File
import java.io.FileOutputStream
import java.util.Collections

class ImmichWallpaperService : WallpaperService() {
  companion object {
    private val activeEngines = Collections.synchronizedSet(mutableSetOf<WallpaperEngine>())
    private val activeServices = Collections.synchronizedSet(mutableSetOf<ImmichWallpaperService>())
    private const val WAKE_APPLY_DEBOUNCE_MS = 1_500L

    fun refreshActiveWallpapers() {
      val services = synchronized(activeServices) { activeServices.toList() }
      services.forEach { it.refreshConfiguredWallpaper() }
    }
  }

  private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val wallpaperOperationMutex = Mutex()
  private var lastWakeApplyElapsed = 0L

  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        Intent.ACTION_SCREEN_OFF -> preloadNextWallpaper()
        Intent.ACTION_SCREEN_ON,
        Intent.ACTION_USER_PRESENT -> applyPreloadedWallpaperForWake()
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    activeServices.add(this)
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      registerReceiver(screenReceiver, filter)
    }
  }

  override fun onDestroy() {
    activeServices.remove(this)
    unregisterReceiver(screenReceiver)
    serviceScope.cancel()
    super.onDestroy()
  }

  override fun onCreateEngine(): Engine {
    return WallpaperEngine()
  }

  private fun preloadNextWallpaper() {
    serviceScope.launch {
      runCatching {
        wallpaperOperationMutex.withLock {
          preloadNextWallpaperLocked()
        }
      }
    }
  }

  private fun refreshConfiguredWallpaper() {
    serviceScope.launch {
      fetchAndApplyNextWallpaper()
    }
  }

  private fun applyPreloadedWallpaperForWake() {
    val now = SystemClock.elapsedRealtime()
    if (now - lastWakeApplyElapsed < WAKE_APPLY_DEBOUNCE_MS) {
      return
    }

    serviceScope.launch {
      val didApply = runCatching {
        wallpaperOperationMutex.withLock {
          applyPreloadedWallpaperLocked()
        }
      }.getOrDefault(false)

      if (didApply) {
        lastWakeApplyElapsed = now
        drawActiveWallpapers()
      }
    }
  }

  private suspend fun preloadNextWallpaperLocked() {
    val config = DynamicWallpaperConfigStore.read(applicationContext)
    val assetIds = config.assetIds
    if (assetIds.isEmpty()) {
      invalidatePreloadedWallpaper()
      return
    }

    val index = config.nextIndex % assetIds.size
    if (isPreloadedWallpaperCurrent(config, index)) {
      return
    }

    val serverConfig = ImmichAPI.getServerConfig(applicationContext) ?: return
    val bitmap = runCatching { ImmichAPI(serverConfig).fetchImage(assetIds[index]) }.getOrNull() ?: return

    runCatching {
      saveCache(bitmap, nextCacheFile())
      DynamicWallpaperConfigStore.writePreloadedIndex(applicationContext, index)
    }.onFailure {
      invalidatePreloadedWallpaper()
    }
  }

  private suspend fun applyPreloadedWallpaperLocked(): Boolean {
    val config = DynamicWallpaperConfigStore.read(applicationContext)
    val assetIds = config.assetIds
    if (assetIds.isEmpty()) {
      invalidatePreloadedWallpaper()
      return false
    }

    val index = config.nextIndex % assetIds.size
    if (!isPreloadedWallpaperCurrent(config, index)) {
      invalidatePreloadedWallpaper()
      return false
    }

    return withContext(Dispatchers.IO) {
      runCatching {
        nextCacheFile().copyTo(cacheFile(), overwrite = true)
        nextCacheFile().delete()
        DynamicWallpaperConfigStore.clearPreloadedIndex(applicationContext)
        DynamicWallpaperConfigStore.writeNextIndex(applicationContext, (index + 1) % assetIds.size)
      }.isSuccess
    }
  }

  private fun isPreloadedWallpaperCurrent(config: DynamicWallpaperConfig, index: Int): Boolean {
    return config.preloadedIndex == index && nextCacheFile().exists()
  }

  private suspend fun fetchAndApplyNextWallpaper() {
    wallpaperOperationMutex.withLock {
      invalidatePreloadedWallpaper()

      val config = DynamicWallpaperConfigStore.read(applicationContext)
      val assetIds = config.assetIds
      if (assetIds.isEmpty()) {
        drawActiveWallpapers()
        return@withLock
      }

      val serverConfig = ImmichAPI.getServerConfig(applicationContext)
      if (serverConfig == null) {
        drawActiveWallpapers()
        return@withLock
      }

      val index = config.nextIndex % assetIds.size
      val bitmap = runCatching { ImmichAPI(serverConfig).fetchImage(assetIds[index]) }.getOrNull()
      if (bitmap == null) {
        drawActiveWallpapers()
        return@withLock
      }

      saveCache(bitmap, cacheFile())
      DynamicWallpaperConfigStore.writeNextIndex(applicationContext, (index + 1) % assetIds.size)
      drawActiveWallpapers()
    }
  }

  private fun invalidatePreloadedWallpaper() {
    nextCacheFile().delete()
    DynamicWallpaperConfigStore.clearPreloadedIndex(applicationContext)
  }

  private fun drawActiveWallpapers() {
    val engines = synchronized(activeEngines) { activeEngines.toList() }
    engines.forEach { it.drawCachedOrFallback() }
  }

  private suspend fun saveCache(bitmap: Bitmap, file: File) = withContext(Dispatchers.IO) {
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
    }
  }

  private fun cacheFile(): File {
    return File(applicationContext.cacheDir, kDynamicWallpaperImageFilename)
  }

  private fun nextCacheFile(): File {
    return File(applicationContext.cacheDir, kDynamicWallpaperNextImageFilename)
  }

  inner class WallpaperEngine : Engine() {
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)

    override fun onCreate(surfaceHolder: SurfaceHolder) {
      super.onCreate(surfaceHolder)
      activeEngines.add(this)
    }

    override fun onVisibilityChanged(visible: Boolean) {
      if (visible) {
        if (cacheFile().exists()) {
          drawCachedOrFallback()
        } else {
          drawFallback()
          refreshConfiguredWallpaper()
        }
      }
    }

    override fun onSurfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
      super.onSurfaceChanged(holder, format, width, height)
      drawCachedOrFallback()
    }

    override fun onDestroy() {
      activeEngines.remove(this)
      super.onDestroy()
    }

    fun drawCachedOrFallback() {
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
  }
}
