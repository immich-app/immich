package app.alextran.immich.images

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ColorSpace
import android.graphics.ImageDecoder
import android.os.Build
import android.os.CancellationSignal
import android.util.Size
import app.alextran.immich.core.SSLConfig
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
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

  init {
    System.loadLibrary("native_buffer")
    cacheDir = context.cacheDir
    client = buildClient()
  }

  companion object {
    private const val MAX_REQUESTS_PER_HOST = 16
    private const val KEEP_ALIVE_CONNECTIONS = 10
    private const val KEEP_ALIVE_DURATION_MINUTES = 5L
    private const val CACHE_SIZE_BYTES = 1024L * 1024 * 1024

    val CANCELLED = Result.success<Map<String, Long>>(emptyMap())
    private val decodePool = Executors.newFixedThreadPool(
      (Runtime.getRuntime().availableProcessors() / 2).coerceAtLeast(2)
    )

    private var cacheDir: File? = null
    private var client: OkHttpClient? = null

    init {
      SSLConfig.addListener(::invalidateClient)
    }

    private fun invalidateClient() {
      client?.let {
        it.dispatcher.cancelAll()
        it.connectionPool.evictAll()
        it.cache?.close()
      }
      client = buildClient()
    }

    private fun buildClient(): OkHttpClient {
      val connectionPool = ConnectionPool(
        maxIdleConnections = KEEP_ALIVE_CONNECTIONS,
        keepAliveDuration = KEEP_ALIVE_DURATION_MINUTES,
        timeUnit = TimeUnit.MINUTES
      )

      val builder = OkHttpClient.Builder()
        .dispatcher(Dispatcher().apply { maxRequestsPerHost = MAX_REQUESTS_PER_HOST })
        .connectionPool(connectionPool)

      cacheDir?.let { dir ->
        val cacheSubdir = File(dir, "thumbnails")
        builder.cache(Cache(cacheSubdir, CACHE_SIZE_BYTES))
      }

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
            val res = bitmap.toNativeBuffer()
            callback(Result.success(res))
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
    val request = requestMap.remove(requestId) ?: return
    request.cancellationSignal.cancel()
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
