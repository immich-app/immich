package app.alextran.immich.images

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ColorSpace
import android.graphics.ImageDecoder
import android.os.Build
import android.os.CancellationSignal
import app.alextran.immich.core.SSLConfig
import com.google.net.cronet.okhttptransport.CronetCallFactory
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import org.chromium.net.CronetEngine
import java.io.File
import java.io.IOException
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

data class RemoteRequest(
  val callback: (Result<Map<String, Long>>) -> Unit,
  val cancellationSignal: CancellationSignal,
)

class RemoteImagesImpl(context: Context) : RemoteImageApi {
  private val requestMap = ConcurrentHashMap<Long, RemoteRequest>()
  private val lockedBitmaps = ConcurrentHashMap<Long, Bitmap>()

  init {
    appContext = context.applicationContext
    cacheDir = context.cacheDir
    client = buildClient()
  }

  companion object {
    private const val MAX_REQUESTS_PER_HOST = 16
    private const val KEEP_ALIVE_CONNECTIONS = 10
    private const val KEEP_ALIVE_DURATION_MINUTES = 5L
    private const val CACHE_SIZE_BYTES = 1024L * 1024 * 1024

    val CANCELLED = Result.success<Map<String, Long>>(emptyMap())
    private val decodePool =
      Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() / 2 + 1)

    private var appContext: Context? = null
    private var cacheDir: File? = null
    private var client: Call.Factory? = null
    private var cronetEngine: CronetEngine? = null

    init {
      System.loadLibrary("native_buffer")
      SSLConfig.addListener(::invalidateClient)
    }

    @JvmStatic
    external fun lockBitmapPixels(bitmap: Bitmap): Long

    @JvmStatic
    external fun unlockBitmapPixels(bitmap: Bitmap)

    private fun invalidateClient() {
      (client as? OkHttpClient)?.let {
        it.dispatcher.cancelAll()
        it.connectionPool.evictAll()
        it.cache?.close()
      }
      cronetEngine?.shutdown()
      cronetEngine = null

      client = buildClient()
    }

    private fun buildClient(): Call.Factory {
      val dir = cacheDir ?: throw IllegalStateException("Cache dir not set")
      return if (SSLConfig.requiresCustomSSL) {
        buildOkHttpClient(dir)
      } else {
        buildCronetClient(dir)
      }
    }

    private fun buildCronetClient(cacheDir: File): Call.Factory {
      val ctx = appContext ?: throw IllegalStateException("Context not set")
      val storageDir = File(cacheDir, "cronet").apply { mkdirs() }
      val engine = CronetEngine.Builder(ctx)
        .enableHttp2(true)
        .enableQuic(true)
        .enableBrotli(true)
        .setStoragePath(storageDir.absolutePath)
        .build()
        .also { cronetEngine = it }

      return CronetCallFactory.newBuilder(engine).build()
    }

    private fun buildOkHttpClient(cacheDir: File): OkHttpClient {
      val dir = File(cacheDir, "okhttp")
      val connectionPool = ConnectionPool(
        maxIdleConnections = KEEP_ALIVE_CONNECTIONS,
        keepAliveDuration = KEEP_ALIVE_DURATION_MINUTES,
        timeUnit = TimeUnit.MINUTES
      )

      val builder = OkHttpClient.Builder()
        .dispatcher(Dispatcher().apply { maxRequestsPerHost = MAX_REQUESTS_PER_HOST })
        .connectionPool(connectionPool)

      builder.cache(Cache((File(dir, "thumbnails")), CACHE_SIZE_BYTES))

      val sslSocketFactory = SSLConfig.sslSocketFactory
      val trustManager = SSLConfig.trustManager
      if (sslSocketFactory != null && trustManager != null) {
        builder.sslSocketFactory(sslSocketFactory, trustManager)
      }

      return builder.build()
    }
  }

  override fun requestImage(
    url: String,
    headers: Map<String, String>,
    requestId: Long,
    callback: (Result<Map<String, Long>>) -> Unit
  ) {
    val client = client ?: return callback(Result.failure(RuntimeException("No client")))
    val signal = CancellationSignal()
    val requestBuilder = Request.Builder().url(url)
    headers.forEach(requestBuilder::addHeader)

    val call = client.newCall(requestBuilder.build())
    signal.setOnCancelListener(call::cancel)
    val request = RemoteRequest(callback, signal)
    requestMap[requestId] = request

    call.enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        requestMap.remove(requestId)
        val result = if (signal.isCanceled) CANCELLED else Result.failure(e)
        callback(result)
      }

      override fun onResponse(call: Call, response: Response) {
        decodePool.execute {
          try {
            signal.throwIfCanceled()
            val bytes = response.takeIf { it.isSuccessful }?.body?.bytes()
              ?: return@execute callback(Result.failure(IOException(response.toString())))
            signal.throwIfCanceled()
            val bitmap = decodeImage(bytes)
            signal.throwIfCanceled()

            val pointer = lockBitmapPixels(bitmap)
            if (pointer == 0L) {
              bitmap.recycle()
              return@execute callback(Result.failure(RuntimeException("Failed to lock bitmap pixels")))
            }

            lockedBitmaps[requestId] = bitmap
            callback(Result.success(mapOf(
              "pointer" to pointer,
              "width" to bitmap.width.toLong(),
              "height" to bitmap.height.toLong(),
              "rowBytes" to bitmap.rowBytes.toLong()
            )))
          } catch (e: Exception) {
            val result = if (signal.isCanceled) CANCELLED else Result.failure(e)
            callback(result)
          } finally {
            requestMap.remove(requestId)
            response.close()
          }
        }
      }
    })
  }

  override fun cancelRequest(requestId: Long) {
    requestMap.remove(requestId)?.cancellationSignal?.cancel()
    releaseImage(requestId)
  }

  override fun releaseImage(requestId: Long) {
    val bitmap = lockedBitmaps.remove(requestId) ?: return
    unlockBitmapPixels(bitmap)
    bitmap.recycle()
  }

  private fun decodeImage(bytes: ByteArray): Bitmap {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ImageDecoder.createSource(ByteBuffer.wrap(bytes)).decodeBitmap()
    } else {
      val options = BitmapFactory.Options().apply {
        inPreferredConfig = Bitmap.Config.ARGB_8888
        inPreferredColorSpace = ColorSpace.get(ColorSpace.Named.SRGB)
      }
      BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
    }
  }
}
