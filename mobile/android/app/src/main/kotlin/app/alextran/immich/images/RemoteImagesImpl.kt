package app.alextran.immich.images

import android.content.Context
import android.os.CancellationSignal
import android.os.OperationCanceledException
import app.alextran.immich.BuildConfig
import app.alextran.immich.INITIAL_BUFFER_SIZE
import app.alextran.immich.NativeBuffer
import app.alextran.immich.NativeByteBuffer
import app.alextran.immich.core.SSLConfig
import okhttp3.Cache
import okhttp3.Call
import okhttp3.Callback
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.chromium.net.CronetEngine
import org.chromium.net.CronetException
import org.chromium.net.UrlRequest
import org.chromium.net.UrlResponseInfo
import java.io.EOFException
import java.io.File
import java.io.IOException
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.X509TrustManager


private const val USER_AGENT = "Immich_Android_${BuildConfig.VERSION_NAME}"
private const val MAX_REQUESTS_PER_HOST = 64
private const val KEEP_ALIVE_CONNECTIONS = 10
private const val KEEP_ALIVE_DURATION_MINUTES = 5L
private const val CACHE_SIZE_BYTES = 1024L * 1024 * 1024

private class RemoteRequest(val cancellationSignal: CancellationSignal)

class RemoteImagesImpl(context: Context) : RemoteImageApi {
  private val requestMap = ConcurrentHashMap<Long, RemoteRequest>()

  init {
    ImageFetcherManager.initialize(context)
  }

  companion object {
    val CANCELLED = Result.success<Map<String, Long>?>(null)
  }

  override fun requestImage(
    url: String,
    headers: Map<String, String>,
    requestId: Long,
    callback: (Result<Map<String, Long>?>) -> Unit
  ) {
    val signal = CancellationSignal()
    requestMap[requestId] = RemoteRequest(signal)

    ImageFetcherManager.fetch(
      url,
      headers,
      signal,
      onSuccess = { buffer ->
        requestMap.remove(requestId)
        if (signal.isCanceled) {
          NativeBuffer.free(buffer.pointer)
          return@fetch callback(CANCELLED)
        }

        callback(
          Result.success(
            mapOf(
              "pointer" to buffer.pointer,
              "length" to buffer.offset.toLong()
            )
          )
        )
      },
      onFailure = { e ->
        requestMap.remove(requestId)
        val result = if (signal.isCanceled) CANCELLED else Result.failure(e)
        callback(result)
      }
    )
  }

  override fun cancelRequest(requestId: Long) {
    requestMap.remove(requestId)?.cancellationSignal?.cancel()
  }
}

private object ImageFetcherManager {
  private lateinit var appContext: Context
  private lateinit var cacheDir: File
  private lateinit var fetcher: ImageFetcher
  private var initialized = false

  fun initialize(context: Context) {
    if (initialized) return
    synchronized(this) {
      if (initialized) return
      appContext = context.applicationContext
      cacheDir = context.cacheDir
      fetcher = build()
      SSLConfig.addListener(::invalidate)
      initialized = true
    }
  }

  fun fetch(
    url: String,
    headers: Map<String, String>,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  ) {
    fetcher.fetch(url, headers, signal, onSuccess, onFailure)
  }

  private fun invalidate() {
    synchronized(this) {
      val oldFetcher = fetcher
      if (oldFetcher is OkHttpImageFetcher && SSLConfig.requiresCustomSSL) {
        fetcher = oldFetcher.reconfigure(SSLConfig.sslSocketFactory, SSLConfig.trustManager)
        return
      }
      fetcher = build()
      oldFetcher.drain()
    }
  }

  private fun build(): ImageFetcher {
    return if (SSLConfig.requiresCustomSSL) {
      OkHttpImageFetcher.create(cacheDir, SSLConfig.sslSocketFactory, SSLConfig.trustManager)
    } else {
      CronetImageFetcher(appContext, cacheDir)
    }
  }
}

private sealed interface ImageFetcher {
  fun fetch(
    url: String,
    headers: Map<String, String>,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  )

  fun drain()
}

private class CronetImageFetcher(context: Context, cacheDir: File) : ImageFetcher {
  private val engine: CronetEngine
  private val executor = Executors.newFixedThreadPool(4)
  private val stateLock = Any()
  private var activeCount = 0
  private var draining = false

  init {
    val storageDir = File(cacheDir, "cronet").apply { mkdirs() }
    engine = CronetEngine.Builder(context)
      .enableHttp2(true)
      .enableQuic(true)
      .enableBrotli(true)
      .setStoragePath(storageDir.absolutePath)
      .setUserAgent(USER_AGENT)
      .enableHttpCache(CronetEngine.Builder.HTTP_CACHE_DISK, CACHE_SIZE_BYTES)
      .build()
  }

  override fun fetch(
    url: String,
    headers: Map<String, String>,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  ) {
    synchronized(stateLock) {
      if (draining) {
        onFailure(IllegalStateException("Engine is draining"))
        return
      }
      activeCount++
    }

    val callback = FetchCallback(onSuccess, onFailure, ::onComplete)
    val requestBuilder = engine.newUrlRequestBuilder(url, callback, executor)
    headers.forEach { (key, value) -> requestBuilder.addHeader(key, value) }
    val request = requestBuilder.build()
    signal.setOnCancelListener(request::cancel)
    request.start()
  }

  private fun onComplete() {
    val shouldShutdown = synchronized(stateLock) {
      activeCount--
      draining && activeCount == 0
    }
    if (shouldShutdown) {
      engine.shutdown()
      executor.shutdown()
    }
  }

  override fun drain() {
    val shouldShutdown = synchronized(stateLock) {
      if (draining) return
      draining = true
      activeCount == 0
    }
    if (shouldShutdown) {
      engine.shutdown()
      executor.shutdown()
    }
  }

  private class FetchCallback(
    private val onSuccess: (NativeByteBuffer) -> Unit,
    private val onFailure: (Exception) -> Unit,
    private val onComplete: () -> Unit,
  ) : UrlRequest.Callback() {
    private var buffer: NativeByteBuffer? = null
    private var wrapped: ByteBuffer? = null
    private var httpError: IOException? = null

    override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newUrl: String) {
      request.followRedirect()
    }

    override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
      if (info.httpStatusCode !in 200..299) {
        httpError = IOException("HTTP ${info.httpStatusCode}: ${info.httpStatusText}")
        return request.cancel()
      }

      val contentLength = info.allHeaders["content-length"]?.firstOrNull()?.toIntOrNull() ?: 0
      if (contentLength > 0) {
        buffer = NativeByteBuffer(contentLength + 1)
        wrapped = NativeBuffer.wrap(buffer!!.pointer, contentLength + 1)
        request.read(wrapped)
      } else {
        buffer = NativeByteBuffer(INITIAL_BUFFER_SIZE)
        request.read(buffer!!.wrapRemaining())
      }
    }

    override fun onReadCompleted(
      request: UrlRequest,
      info: UrlResponseInfo,
      byteBuffer: ByteBuffer
    ) {
      val buf = if (wrapped == null) {
        buffer!!.run {
          advance(byteBuffer.position())
          ensureHeadroom()
          wrapRemaining()
        }
      } else {
        wrapped
      }
      request.read(buf)
    }

    override fun onSucceeded(request: UrlRequest, info: UrlResponseInfo) {
      wrapped?.let { buffer!!.advance(it.position()) }
      onSuccess(buffer!!)
      onComplete()
    }

    override fun onFailed(request: UrlRequest, info: UrlResponseInfo?, error: CronetException) {
      buffer?.free()
      onFailure(error)
      onComplete()
    }

    override fun onCanceled(request: UrlRequest, info: UrlResponseInfo?) {
      buffer?.free()
      onFailure(httpError ?: OperationCanceledException())
      onComplete()
    }
  }
}

private class OkHttpImageFetcher private constructor(
  private val client: OkHttpClient,
) : ImageFetcher {
  private val stateLock = Any()
  private var activeCount = 0
  private var draining = false

  companion object {
    fun create(
      cacheDir: File,
      sslSocketFactory: SSLSocketFactory?,
      trustManager: X509TrustManager?,
    ): OkHttpImageFetcher {
      val dir = File(cacheDir, "okhttp")
      val connectionPool = ConnectionPool(
        maxIdleConnections = KEEP_ALIVE_CONNECTIONS,
        keepAliveDuration = KEEP_ALIVE_DURATION_MINUTES,
        timeUnit = TimeUnit.MINUTES
      )

      val builder = OkHttpClient.Builder()
        .addInterceptor { chain ->
          chain.proceed(
            chain.request().newBuilder()
              .header("User-Agent", USER_AGENT)
              .build()
          )
        }
        .dispatcher(Dispatcher().apply { maxRequestsPerHost = MAX_REQUESTS_PER_HOST })
        .connectionPool(connectionPool)
        .cache(Cache(File(dir, "thumbnails"), CACHE_SIZE_BYTES))

      if (sslSocketFactory != null && trustManager != null) {
        builder.sslSocketFactory(sslSocketFactory, trustManager)
      }

      return OkHttpImageFetcher(builder.build())
    }
  }

  fun reconfigure(
    sslSocketFactory: SSLSocketFactory?,
    trustManager: X509TrustManager?,
  ): OkHttpImageFetcher {
    val builder = client.newBuilder()
    if (sslSocketFactory != null && trustManager != null) {
      builder.sslSocketFactory(sslSocketFactory, trustManager)
    }
    // Evict idle connections using old SSL config
    client.connectionPool.evictAll()
    return OkHttpImageFetcher(builder.build())
  }

  private fun onComplete() {
    val shouldClose = synchronized(stateLock) {
      activeCount--
      draining && activeCount == 0
    }
    if (shouldClose) {
      client.cache?.close()
    }
  }

  override fun fetch(
    url: String,
    headers: Map<String, String>,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  ) {
    synchronized(stateLock) {
      if (draining) {
        return onFailure(IllegalStateException("Client is draining"))
      }
      activeCount++
    }

    val requestBuilder = Request.Builder().url(url)
    headers.forEach { (key, value) -> requestBuilder.addHeader(key, value) }
    val call = client.newCall(requestBuilder.build())
    signal.setOnCancelListener(call::cancel)

    call.enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        onFailure(e)
        onComplete()
      }

      override fun onResponse(call: Call, response: Response) {
        response.use {
          if (!response.isSuccessful) {
            return onFailure(IOException("HTTP ${response.code}: ${response.message}")).also { onComplete() }
          }

          val body = response.body
            ?: return onFailure(IOException("Empty response body")).also { onComplete() }

          if (call.isCanceled()) {
            onFailure(OperationCanceledException())
            return onComplete()
          }

          body.source().use { source ->
            val length = body.contentLength().toInt()
            val buffer = NativeByteBuffer(if (length > 0) length else INITIAL_BUFFER_SIZE)
            try {
              if (length > 0) {
                val wrapped = NativeBuffer.wrap(buffer.pointer, length)
                while (wrapped.hasRemaining()) {
                  if (call.isCanceled()) throw OperationCanceledException()
                  if (source.read(wrapped) == -1) throw EOFException()
                }
                buffer.advance(length)
              } else {
                while (true) {
                  if (call.isCanceled()) throw OperationCanceledException()
                  val bytesRead = source.read(buffer.wrapRemaining())
                  if (bytesRead == -1) break
                  buffer.advance(bytesRead)
                  buffer.ensureHeadroom()
                }
              }
              onSuccess(buffer)
            } catch (e: Exception) {
              buffer.free()
              onFailure(e)
            }
          }
        }
      }
    })
  }

  override fun drain() {
    val shouldClose = synchronized(stateLock) {
      if (draining) return
      draining = true
      activeCount == 0
    }
    client.connectionPool.evictAll()
    if (shouldClose) {
      client.cache?.close()
    }
  }
}
