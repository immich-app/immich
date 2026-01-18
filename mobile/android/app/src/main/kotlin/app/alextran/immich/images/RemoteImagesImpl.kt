package app.alextran.immich.images

import android.content.Context
import android.os.CancellationSignal
import app.alextran.immich.BuildConfig
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
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import okhttp3.Interceptor

data class RemoteRequest(
  val callback: (Result<Map<String, Long>>) -> Unit,
  val cancellationSignal: CancellationSignal,
  var pointer: Long = 0L,
)

class UserAgentInterceptor : Interceptor {
  companion object {
    const val USER_AGENT = "Immich_Android_${BuildConfig.VERSION_NAME}"
  }

  override fun intercept(chain: Interceptor.Chain): Response {
    return chain.proceed(
      chain.request().newBuilder()
        .header("User-Agent", USER_AGENT)
        .build()
    )
  }
}

class RemoteImagesImpl(context: Context) : RemoteImageApi {
  private val requestMap = ConcurrentHashMap<Long, RemoteRequest>()

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

    private const val INITIAL_BUFFER_SIZE = 64 * 1024

    val CANCELLED = Result.success<Map<String, Long>>(emptyMap())

    private var appContext: Context? = null
    private var cacheDir: File? = null
    private var client: Call.Factory? = null
    private var cronetEngine: CronetEngine? = null

    init {
      System.loadLibrary("native_buffer")
      SSLConfig.addListener(::invalidateClient)
    }

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
//        .enableHttpCache(CronetEngine.Builder.HTTP_CACHE_DISK, CACHE_SIZE_BYTES)
        .setUserAgent(UserAgentInterceptor.USER_AGENT)
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
        .addInterceptor(UserAgentInterceptor())
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
        var pointer = 0L
        var capacity: Int
        try {
          signal.throwIfCanceled()
          val body = response.takeIf { it.isSuccessful }?.body
            ?: return callback(Result.failure(IOException(response.toString())))

          val contentLength = body.contentLength()
          capacity = if (contentLength > 0) contentLength.toInt() else INITIAL_BUFFER_SIZE
          pointer = LocalImagesImpl.allocateNative(capacity)
          request.pointer = pointer

          var position = 0
          body.source().use { source ->
            while (!source.exhausted()) {
              signal.throwIfCanceled()
              if (position >= capacity) {
                capacity = maxOf(capacity * 2, position + 8192)
                pointer = LocalImagesImpl.reallocNative(pointer, capacity)
                request.pointer = pointer
              }
              val buffer = LocalImagesImpl.wrapAsBuffer(pointer + position, capacity - position)
              val read = source.read(buffer)
              if (read == -1) break
              position += read
            }
          }

          signal.throwIfCanceled()
          request.pointer = 0L // Transfer ownership to Dart before callback
          callback(Result.success(mapOf(
            "pointer" to pointer,
            "length" to position.toLong()
          )))
        } catch (e: Exception) {
          if (pointer != 0L) LocalImagesImpl.freeNative(pointer)
          val result = if (signal.isCanceled) CANCELLED else Result.failure(e)
          callback(result)
        } finally {
          requestMap.remove(requestId)
          response.close()
        }
      }
    })
  }

  override fun cancelRequest(requestId: Long) {
    // Just cancel the signal - memory cleanup happens in onResponse/onFailure
    requestMap[requestId]?.cancellationSignal?.cancel()
  }

  override fun releaseImage(requestId: Long) {}
}
