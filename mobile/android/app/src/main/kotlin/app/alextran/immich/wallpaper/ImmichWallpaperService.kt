package app.alextran.immich.wallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.os.SystemClock
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import app.alextran.immich.images.calculateInSampleSize
import app.alextran.immich.images.drawBitmapCenterCrop
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Collections

class ImmichWallpaperService : WallpaperService() {
  companion object {
    private val activeEngines = Collections.synchronizedSet(mutableSetOf<WallpaperEngine>())
    private val FALLBACK_COLOR = Color.rgb(18, 18, 18)

    fun refreshActiveWallpapers() {
      val engines = synchronized(activeEngines) { activeEngines.toList() }
      engines.forEach { it.drawLocalOrFallback() }
    }
  }

  private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val wallpaperOperationMutex = Mutex()
  private val wakeCoordinator = DynamicWallpaperWakeCoordinator()

  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        Intent.ACTION_SCREEN_ON,
        Intent.ACTION_USER_PRESENT -> requestWakeRotation()
        Intent.ACTION_SCREEN_OFF -> wakeCoordinator.onScreenOff()
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
      addAction(Intent.ACTION_SCREEN_OFF)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      registerReceiver(screenReceiver, filter)
    }
  }

  override fun onDestroy() {
    runCatching { unregisterReceiver(screenReceiver) }
    serviceScope.cancel()
    super.onDestroy()
  }

  override fun onCreateEngine(): Engine {
    return WallpaperEngine()
  }

  private fun requestWakeRotation() {
    serviceScope.launch {
      val shouldRefresh = wallpaperOperationMutex.withLock {
        val hasVisibleWallpaper = synchronized(activeEngines) { activeEngines.any { it.isWallpaperVisible } }
        val shouldRotate = wakeCoordinator.onWakeSignal(hasVisibleWallpaper, SystemClock.elapsedRealtime())
        if (shouldRotate) {
          rotateActiveIndex()
        }
        shouldRotate
      }

      if (shouldRefresh) {
        refreshActiveWallpapers()
      }
    }
  }

  private fun requestVisibleWallpaperDraw(engine: WallpaperEngine) {
    serviceScope.launch {
      val shouldRefresh = wallpaperOperationMutex.withLock {
        val shouldRotate = wakeCoordinator.onWallpaperVisible(SystemClock.elapsedRealtime())
        if (shouldRotate) {
          rotateActiveIndex()
        }
        shouldRotate
      }

      if (shouldRefresh) {
        refreshActiveWallpapers()
      } else {
        engine.drawLocalOrFallback()
      }
    }
  }

  private fun rotateActiveIndex() {
    val config = DynamicWallpaperConfigStore.read(applicationContext)
    val nextIndex = DynamicWallpaperRotation.nextAvailableIndex(config) { assetId ->
      DynamicWallpaperConfigStore.hasPreparedFile(applicationContext, assetId)
    }

    if (nextIndex != null) {
      DynamicWallpaperConfigStore.writeActiveIndex(applicationContext, nextIndex)
    }
  }

  inner class WallpaperEngine : Engine() {
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    var isWallpaperVisible = false
      private set

    override fun onCreate(surfaceHolder: SurfaceHolder) {
      super.onCreate(surfaceHolder)
      setOffsetNotificationsEnabled(false)
      activeEngines.add(this)
    }

    override fun onVisibilityChanged(visible: Boolean) {
      isWallpaperVisible = visible
      if (visible) {
        requestVisibleWallpaperDraw(this)
      }
    }

    override fun onSurfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
      super.onSurfaceChanged(holder, format, width, height)
      if (isWallpaperVisible) {
        drawLocalOrFallback()
      }
    }

    override fun onSurfaceDestroyed(holder: SurfaceHolder) {
      isWallpaperVisible = false
      super.onSurfaceDestroyed(holder)
    }

    override fun onDestroy() {
      activeEngines.remove(this)
      isWallpaperVisible = false
      super.onDestroy()
    }

    fun drawLocalOrFallback() {
      val holder = surfaceHolder
      if (!holder.surface.isValid) {
        return
      }

      val frame = holder.surfaceFrame
      val targetWidth = frame.width().coerceAtLeast(1)
      val targetHeight = frame.height().coerceAtLeast(1)
      serviceScope.launch {
        val bitmap = withContext(Dispatchers.IO) {
          runCatching { loadActiveBitmap(targetWidth, targetHeight) }.getOrNull()
        }
        drawBitmapOrFallback(bitmap)
      }
    }

    private fun drawBitmapOrFallback(bitmap: Bitmap?) {
      val holder = surfaceHolder
      if (!holder.surface.isValid) {
        bitmap?.recycle()
        return
      }

      val canvas = runCatching { holder.lockCanvas() }.getOrNull()
      if (canvas == null) {
        bitmap?.recycle()
        return
      }
      try {
        if (bitmap == null) {
          drawFallback(canvas)
        } else {
          drawBitmap(canvas, bitmap)
        }
      } finally {
        bitmap?.recycle()
        holder.unlockCanvasAndPost(canvas)
      }
    }

    private fun loadActiveBitmap(targetWidth: Int, targetHeight: Int): Bitmap? {
      val file = activeFile() ?: return null
      val options = BitmapFactory.Options().apply {
        inJustDecodeBounds = true
      }
      BitmapFactory.decodeFile(file.absolutePath, options)

      val sampleOptions = BitmapFactory.Options().apply {
        inSampleSize = calculateInSampleSize(options, targetWidth, targetHeight)
      }
      return BitmapFactory.decodeFile(file.absolutePath, sampleOptions)
    }

    private fun activeFile(): File? {
      val config = DynamicWallpaperConfigStore.read(applicationContext)
      val activeIndex = DynamicWallpaperRotation.currentOrFirstAvailableIndex(config) { assetId ->
        DynamicWallpaperConfigStore.hasPreparedFile(applicationContext, assetId)
      } ?: return null

      return DynamicWallpaperConfigStore.preparedFile(applicationContext, config.assetIds[activeIndex])
    }

    private fun drawFallback(canvas: Canvas) {
      canvas.drawColor(FALLBACK_COLOR)
    }

    private fun drawBitmap(canvas: Canvas, bitmap: Bitmap) {
      canvas.drawColor(FALLBACK_COLOR)
      drawBitmapCenterCrop(canvas, bitmap, paint)
    }
  }
}
