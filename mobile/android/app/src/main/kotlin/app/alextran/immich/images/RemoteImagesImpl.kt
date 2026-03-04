package app.alextran.immich.images

import android.content.Context
import android.os.CancellationSignal
import android.os.OperationCanceledException
import app.alextran.immich.INITIAL_BUFFER_SIZE
import app.alextran.immich.NativeBuffer
import app.alextran.immich.NativeByteBuffer
import app.alextran.immich.core.HttpClientManager
import app.alextran.immich.core.USER_AGENT
import kotlinx.coroutines.*
import okhttp3.Cache
import okhttp3.Call
import okhttp3.Callback
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
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.attribute.BasicFileAttributes
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors


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
    @Suppress("UNUSED_PARAMETER") preferEncoded: Boolean, // always returns encoded; setting has no effect on Android
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

  override fun clearCache(callback: (Result<Long>) -> Unit) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        ImageFetcherManager.clearCache(callback)
      } catch (e: Exception) {
        callback(Result.failure(e))
      }
    }
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
      HttpClientManager.addClientChangedListener(::invalidate)
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

  fun clearCache(onCleared: (Result<Long>) -> Unit) {
    fetcher.clearCache(onCleared)
  }

  private fun invalidate() {
    synchronized(this) {
      val oldFetcher = fetcher
      fetcher = build()
      oldFetcher.drain()
    }
  }

  private fun build(): ImageFetcher {
    return if (HttpClientManager.isMtls) {
      OkHttpImageFetcher.create(cacheDir)
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

  fun clearCache(onCleared: (Result<Long>) -> Unit)
}

private class CronetImageFetcher(context: Context, cacheDir: File) : ImageFetcher {
  private val ctx = context
  private var engine: CronetEngine
  private val executor = Executors.newFixedThreadPool(4)
  private val stateLock = Any()
  private var activeCount = 0
  private var draining = false
  private var onCacheCleared: ((Result<Long>) -> Unit)? = null
  private val storageDir = File(cacheDir, "cronet").apply { mkdirs() }

  init {
    engine = build(context)
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

  private fun build(ctx: Context): CronetEngine {
    return CronetEngine.Builder(ctx)
      .enableHttp2(true)
      .enableQuic(true)
      .enableBrotli(true)
      .setStoragePath(storageDir.absolutePath)
      .setUserAgent(USER_AGENT)
      .enableHttpCache(CronetEngine.Builder.HTTP_CACHE_DISK, CACHE_SIZE_BYTES)
      .build()
  }

  private fun onComplete() {
    val didDrain = synchronized(stateLock) {
      activeCount--
      draining && activeCount == 0
    }
    if (didDrain) {
      onDrained()
    }
  }

  override fun drain() {
    val didDrain = synchronized(stateLock) {
      if (draining) return
      draining = true
      activeCount == 0
    }
    if (didDrain) {
      onDrained()
    }
  }

  private fun onDrained() {
    engine.shutdown()
    val onCacheCleared = synchronized(stateLock) {
      val onCacheCleared = onCacheCleared
      this.onCacheCleared = null
      onCacheCleared
    }
    if (onCacheCleared == null) {
      executor.shutdown()
    } else {
      CoroutineScope(Dispatchers.IO).launch {
        val result = runCatching { deleteFolderAndGetSize(storageDir.toPath()) }
        // Cronet is very good at self-repair, so it shouldn't fail here regardless of clear result
        engine = build(ctx)
        synchronized(stateLock) { draining = false }
        onCacheCleared(result)
      }
    }
  }

  override fun clearCache(onCleared: (Result<Long>) -> Unit) {
    synchronized(stateLock) {
      if (onCacheCleared != null) {
        return onCleared(Result.success(-1))
      }
      onCacheCleared = onCleared
    }
    drain()
  }

  private class FetchCallback(
    private val onSuccess: (NativeByteBuffer) -> Unit,
    private val onFailure: (Exception) -> Unit,
    private val onComplete: () -> Unit,
  ) : UrlRequest.Callback() {
    private var buffer: NativeByteBuffer? = null
    private var wrapped: ByteBuffer? = null
    private var error: Exception? = null

    override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newUrl: String) {
      request.followRedirect()
    }

    override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
      if (info.httpStatusCode !in 200..299) {
        error = IOException("HTTP ${info.httpStatusCode}: ${info.httpStatusText}")
        return request.cancel()
      }

      try {
        val contentLength = info.allHeaders["content-length"]?.firstOrNull()?.toIntOrNull() ?: 0
        if (contentLength > 0) {
          buffer = NativeByteBuffer(contentLength + 1)
          wrapped = NativeBuffer.wrap(buffer!!.pointer, contentLength + 1)
          request.read(wrapped)
        } else {
          buffer = NativeByteBuffer(INITIAL_BUFFER_SIZE)
          request.read(buffer!!.wrapRemaining())
        }
      } catch (e: Exception) {
        error = e
        return request.cancel()
      }
    }

    override fun onReadCompleted(
      request: UrlRequest,
      info: UrlResponseInfo,
      byteBuffer: ByteBuffer
    ) {
      try {
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
      } catch (e: Exception) {
        error = e
        return request.cancel()
      }
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
      onFailure(error ?: OperationCanceledException())
      onComplete()
    }
  }

  suspend fun deleteFolderAndGetSize(root: Path): Long = withContext(Dispatchers.IO) {
    var totalSize = 0L

    Files.walkFileTree(root, object : SimpleFileVisitor<Path>() {
      override fun visitFile(file: Path, attrs: BasicFileAttributes): FileVisitResult {
        totalSize += attrs.size()
        Files.delete(file)
        return FileVisitResult.CONTINUE
      }

      override fun postVisitDirectory(dir: Path, exc: IOException?): FileVisitResult {
        if (dir != root) {
          Files.delete(dir)
        }
        return FileVisitResult.CONTINUE
      }
    })

    totalSize
  }
}

private class OkHttpImageFetcher private constructor(
  private val client: OkHttpClient,
) : ImageFetcher {
  private val stateLock = Any()
  private var activeCount = 0
  private var draining = false

  companion object {
    fun create(cacheDir: File): OkHttpImageFetcher {
      val dir = File(cacheDir, "okhttp")

      val client = HttpClientManager.getClient().newBuilder()
        .cache(Cache(File(dir, "thumbnails"), CACHE_SIZE_BYTES))
        .build()

      return OkHttpImageFetcher(client)
    }
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
            onComplete()
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
    if (shouldClose) {
      client.cache?.close()
    }
  }

  override fun clearCache(onCleared: (Result<Long>) -> Unit) {
    try {
      val size = client.cache!!.size()
      client.cache!!.evictAll()
      onCleared(Result.success(size))
    } catch (e: Exception) {
      onCleared(Result.failure(e))
    }
  }
}
