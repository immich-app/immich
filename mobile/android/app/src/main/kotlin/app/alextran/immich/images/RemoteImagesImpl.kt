package app.alextran.immich.images

import android.content.Context
import android.graphics.ImageDecoder
import android.os.Build
import android.os.CancellationSignal
import android.os.OperationCanceledException
import app.alextran.immich.INITIAL_BUFFER_SIZE
import app.alextran.immich.NativeBuffer
import app.alextran.immich.NativeByteBuffer
import app.alextran.immich.core.HttpClientManager
import kotlinx.coroutines.*
import okhttp3.Cache
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.chromium.net.CronetException
import org.chromium.net.UrlRequest
import org.chromium.net.UrlResponseInfo
import java.io.EOFException
import java.io.File
import java.io.IOException
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

private const val MAX_PREALLOC_BYTES = 128 * 1024 * 1024

private class RemoteRequest(val cancellationSignal: CancellationSignal)

class RemoteImagesImpl(context: Context) : RemoteImageApi {
  private val requestMap = ConcurrentHashMap<Long, RemoteRequest>()

  init {
    ImageFetcherManager.initialize(context)
  }

  companion object {
    val CANCELLED = Result.success<Map<String, Long>?>(null)

    // Shared, process-lifetime pool: RemoteImagesImpl is re-created per FlutterEngine, so a
    // per-instance pool would leak threads across engine restarts.
    private val decodeExecutor = Executors.newFixedThreadPool(2)
  }

  override fun requestImage(
    url: String,
    requestId: Long,
    preferEncoded: Boolean,
    callback: (Result<Map<String, Long>?>) -> Unit
  ) {
    val signal = CancellationSignal()
    requestMap[requestId] = RemoteRequest(signal)

    ImageFetcherManager.fetch(
      url,
      signal,
      onSuccess = { buffer ->
        if (signal.isCanceled) {
          requestMap.remove(requestId)
          buffer.free()
          return@fetch callback(CANCELLED)
        }

        // Decode natively when the caller wants pixels: Flutter's fallback decoder copies
        // 10-bit bitmaps (RGBA_1010102) as if they were rgba8888, garbling colors. Decode on a
        // dedicated pool - the fetch callback threads are shared with video streaming. On any
        // decode failure (including OOM on huge originals), hand Flutter the encoded bytes as
        // before.
        if (!preferEncoded && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          decodeExecutor.execute {
            val res = if (signal.isCanceled) null else try {
              val source = ImageDecoder.createSource(NativeBuffer.wrap(buffer.pointer, buffer.offset))
              source.decodeBitmap().toNativeBuffer()
            } catch (_: Throwable) {
              null
            }
            requestMap.remove(requestId)
            when {
              // Deliver even if the request was cancelled meanwhile: re-checking here would orphan
              // res's malloc, and Dart frees the buffer itself when it sees the cancel.
              res != null -> {
                buffer.free()
                callback(Result.success(res))
              }
              signal.isCanceled -> {
                buffer.free()
                callback(CANCELLED)
              }
              else -> callback(
                Result.success(
                  mapOf(
                    "pointer" to buffer.pointer,
                    "length" to buffer.offset.toLong()
                  )
                )
              )
            }
          }
          return@fetch
        }

        requestMap.remove(requestId)
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
  private lateinit var cacheDir: File
  private lateinit var fetcher: ImageFetcher
  private var initialized = false

  fun initialize(context: Context) {
    if (initialized) return
    synchronized(this) {
      if (initialized) return
      cacheDir = context.cacheDir
      fetcher = build()
      HttpClientManager.addClientChangedListener(::invalidate)
      initialized = true
    }
  }

  fun fetch(
    url: String,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  ) {
    fetcher.fetch(url, signal, onSuccess, onFailure)
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
      CronetImageFetcher()
    }
  }
}

private sealed interface ImageFetcher {
  fun fetch(
    url: String,
    signal: CancellationSignal,
    onSuccess: (NativeByteBuffer) -> Unit,
    onFailure: (Exception) -> Unit,
  )

  fun drain()

  fun clearCache(onCleared: (Result<Long>) -> Unit)
}

private class CronetImageFetcher : ImageFetcher {
  private val stateLock = Any()
  private var activeCount = 0
  private var draining = false
  private var onCacheCleared: ((Result<Long>) -> Unit)? = null

  override fun fetch(
    url: String,
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
    val requestBuilder = HttpClientManager.cronetEngine!!
      .newUrlRequestBuilder(url, callback, HttpClientManager.cronetExecutor)
    HttpClientManager.getAuthHeaders(url).forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }
    val request = requestBuilder.build()
    signal.setOnCancelListener(request::cancel)
    request.start()
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
    val onCacheCleared = synchronized(stateLock) {
      val onCacheCleared = this.onCacheCleared
      this.onCacheCleared = null
      onCacheCleared
    } ?: return

    CoroutineScope(Dispatchers.IO).launch {
      val result = HttpClientManager.rebuildCronetEngine()
      synchronized(stateLock) { draining = false }
      onCacheCleared(result)
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
        // Content-Length is a size hint only. With Content-Encoding (gzip/br/...),
        // Cronet auto-decompresses and writes decompressed bytes to our buffer, which
        // may exceed the wire/compressed Content-Length. Always use the growable
        // buffer path so we can't overflow.
        val contentLength = info.allHeaders["content-length"]?.firstOrNull()?.toIntOrNull() ?: 0
        // Cap the up-front alloc: Content-Length is untrusted and can be huge or near
        // Int.MAX_VALUE (overflowing `+1`). For larger responses the grow path takes over.
        val initialSize = if (contentLength in 1..MAX_PREALLOC_BYTES) contentLength + 1 else INITIAL_BUFFER_SIZE
        buffer = NativeByteBuffer(initialSize)
        request.read(buffer!!.wrapRemaining())
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
        // Always pass a fresh wrap so byteBuffer.position() represents only the
        // bytes Cronet wrote in this iteration. Reusing the caller-supplied
        // ByteBuffer breaks advance(): Cronet's position keeps accumulating
        // across reads, which would double-count previous iterations' bytes.
        val buf = buffer!!.run {
          advance(byteBuffer.position())
          ensureHeadroom()
          wrapRemaining()
        }
        request.read(buf)
      } catch (e: Exception) {
        error = e
        return request.cancel()
      }
    }

    override fun onSucceeded(request: UrlRequest, info: UrlResponseInfo) {
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
        .cache(Cache(File(dir, "thumbnails"), HttpClientManager.MEDIA_CACHE_SIZE_BYTES))
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
