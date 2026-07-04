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
import android.graphics.Rect
import android.os.Build
import android.os.SystemClock
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
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
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    val filter = IntentFilter().apply {
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

      val canvas = runCatching { holder.lockCanvas() }.getOrNull() ?: return
      try {
        val bitmap = loadActiveBitmap(canvas.width, canvas.height)
        if (bitmap == null) {
          drawFallback(canvas)
        } else {
          drawCenterCrop(canvas, bitmap)
          bitmap.recycle()
        }
      } finally {
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

    private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
      val height = options.outHeight
      val width = options.outWidth
      var inSampleSize = 1

      if (height > reqHeight || width > reqWidth) {
        val halfHeight = height / 2
        val halfWidth = width / 2
        while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
          inSampleSize *= 2
        }
      }

      return inSampleSize
    }

    private fun drawFallback(canvas: Canvas) {
      canvas.drawColor(FALLBACK_COLOR)
    }

    private fun drawCenterCrop(canvas: Canvas, bitmap: Bitmap) {
      canvas.drawColor(FALLBACK_COLOR)

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
  }
}
