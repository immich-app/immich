package app.alextran.immich.core

import org.chromium.net.CronetEngine
import org.chromium.net.CronetException
import org.chromium.net.UploadDataProvider
import org.chromium.net.UploadDataSink
import org.chromium.net.UrlRequest
import org.chromium.net.UrlResponseInfo
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.util.UUID
import java.util.concurrent.ExecutorService

/**
 * 用 Cronet 从磁盘流式上传一个 multipart/form-data 文件。
 *
 * cronet_http 会把整个 body 读进内存，大文件走不了它。
 */
internal class StreamingFileUploader(
  private val engine: CronetEngine,
  private val executor: ExecutorService,
) {

  /** 一次上传的结果。 */
  data class Outcome(
    val isSuccess: Boolean,
    val statusCode: Int,
    val body: String?,
    val errorMessage: String?,
    /** 交给 Cronet 的 body 字节数，Dart 用它判断能不能重发。 */
    val bytesSent: Long = 0,
  ) {
    fun withSentBytes(sent: Long): Outcome = if (bytesSent == sent) this else copy(bytesSent = sent)
  }

  /** 按 progressKey 记的进行中请求，Dart 靠它中断上传。 */
  private val activeRequests = java.util.concurrent.ConcurrentHashMap<String, UrlRequest>()

  /** 在请求登记之前就到达的取消。 */
  private val cancelRequested = java.util.concurrent.ConcurrentHashMap.newKeySet<String>()

  fun cancel(progressKey: String) {
    cancelRequested.add(progressKey)
    activeRequests.remove(progressKey)?.let {
      runCatching { it.cancel() }
    }
  }

  /**
   * 把 [file] 以 multipart/form-data 传到 [url]。不抛异常。
   *
   * @param onProgress 边传边回调（已发字节, 总字节）。
   */
  fun upload(
    url: String,
    file: File,
    fileName: String,
    fileFieldName: String,
    mimeType: String?,
    fields: Map<String, String>,
    onProgress: ((Long, Long) -> Unit)?,
    progressKey: String,
  ): Outcome {
    if (!file.isFile) {
      // 这里要先清，正常路径的 finally 还没到。
      cancelRequested.remove(progressKey)
      return Outcome(false, 0, null, "File not found: ${file.path}")
    }

    val boundary = "----ImmichUpload${UUID.randomUUID().toString().replace("-", "")}"
    val header = buildMultipartHeader(boundary, fields, fileFieldName, fileName, mimeType)
    val footer = "\r\n--$boundary--\r\n".toByteArray(Charsets.UTF_8)
    val fileLength = file.length()

    val provider = FileUploadProvider(file, header, footer, fileLength, onProgress)

    val latch = java.util.concurrent.CountDownLatch(1)
    var outcome: Outcome? = null
    var request: UrlRequest? = null

    // 记下拒绝重定向的原因，取消时带出去。
    var rejectReason: String? = null

    val callback = object : UrlRequest.Callback() {
      override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newLocationUrl: String) {
        // 301/302/303 会丢 body，只有 307/308 保留。
        val code = info.httpStatusCode
        if (code == 307 || code == 308) {
          request.followRedirect()
          return
        }
        rejectReason =
          "Server answered $code redirect to $newLocationUrl, which would drop the upload body. " +
            "Point the server URL at the final endpoint instead."
        request.cancel()
      }

      override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
        request.read(ByteBuffer.allocateDirect(BUFFER_SIZE))
      }

      override fun onReadCompleted(
        request: UrlRequest,
        info: UrlResponseInfo,
        byteBuffer: ByteBuffer,
      ) {
        byteBuffer.flip()
        if (byteBuffer.hasRemaining()) {
          val chunk = ByteArray(byteBuffer.remaining())
          byteBuffer.get(chunk)
          // 限制响应大小，免得超大错误页撑爆堆。
          if (responseBytes.size() < MAX_RESPONSE_BYTES) {
            val room = MAX_RESPONSE_BYTES - responseBytes.size()
            responseBytes.write(chunk, 0, minOf(chunk.size, room))
          }
        }
        byteBuffer.clear()
        request.read(byteBuffer)
      }

      override fun onSucceeded(request: UrlRequest, info: UrlResponseInfo) {
        outcome = Outcome(
          isSuccess = info.httpStatusCode in 200..299,
          statusCode = info.httpStatusCode,
          body = responseBytes.toString(Charsets.UTF_8),
          errorMessage = null,
        )
        latch.countDown()
      }

      override fun onFailed(request: UrlRequest, info: UrlResponseInfo?, error: CronetException) {
        // 展开 cause 链，外层那句说明不了问题。
        outcome = Outcome(
          false,
          info?.httpStatusCode ?: 0,
          null,
          buildString {
            append(error)
            var c: Throwable? = error.cause
            while (c != null) {
              append(" <- ").append(c)
              c = c.cause
            }
          },
        )
        latch.countDown()
      }

      override fun onCanceled(request: UrlRequest, info: UrlResponseInfo?) {
        outcome = Outcome(false, info?.httpStatusCode ?: 0, null, rejectReason ?: "Upload cancelled")
        latch.countDown()
      }

      private val responseBytes = java.io.ByteArrayOutputStream()
    }

    return try {
      val builder = engine.newUrlRequestBuilder(url, callback, executor)

      // Cronet 不会从请求里读持久化的 header。
      HttpClientManager.getAuthHeaders(url).forEach { (key, value) ->
        if (!key.equals("content-length", ignoreCase = true) &&
          !key.equals("content-type", ignoreCase = true)
        ) {
          builder.addHeader(key, value)
        }
      }
      builder.addHeader("Content-Type", "multipart/form-data; boundary=$boundary")

      // Cronet 只在重放时调 rewind，首次读取得自己准备。
      provider.resetForFirstRead()

      val builtRequest = builder
        .setHttpMethod("POST")
        .setUploadDataProvider(provider, executor)
        .build()
      request = builtRequest
      activeRequests[progressKey] = builtRequest
      // start() 之前的 cancel() 无效，onCanceled 也不会回调。
      builtRequest.start()
      // 补上构建期间到达的取消。
      if (cancelRequested.remove(progressKey)) {
        runCatching { builtRequest.cancel() }
      }

      // 轮询而不是 await：硬超时不能等文件传完，卡住要能提前发现。
      val hardDeadlineNanos = System.nanoTime() + uploadTimeoutSeconds(fileLength) * 1_000_000_000L
      var finished = false
      while (true) {
        if (latch.await(1, java.util.concurrent.TimeUnit.SECONDS)) {
          finished = true
          break
        }
        val now = System.nanoTime()
        val idleMs = (now - provider.lastProgressAtNanos) / 1_000_000L
        // body 发完后服务器可能要想很久。
        val stalled = !provider.bodyComplete && idleMs > IDLE_TIMEOUT_MS
        if (now > hardDeadlineNanos || stalled) {
          runCatching { builtRequest.cancel() }
          latch.await(2, java.util.concurrent.TimeUnit.SECONDS)
          break
        }
      }
      if (!finished) {
        outcome?.let { return it.withSentBytes(provider.sentBytes) }
        val why = if (provider.bodyComplete) {
          "Upload timed out waiting for the server response"
        } else {
          val idleSeconds = (System.nanoTime() - provider.lastProgressAtNanos) / 1_000_000_000L
          "Upload stalled: no body progress for ${idleSeconds}s"
        }
        return Outcome(false, 0, null, why).withSentBytes(provider.sentBytes)
      }
      (outcome ?: Outcome(false, 0, null, "Upload finished with no result")).withSentBytes(provider.sentBytes)
    } catch (e: Exception) {
      Outcome(false, 0, null, e.toString()).withSentBytes(provider.sentBytes)
    } finally {
      // 按对象移除，重试复用同一个 key 时不会误删。
      request?.let { activeRequests.remove(progressKey, it) }
      cancelRequested.remove(progressKey)
      provider.closeStream()
    }
  }

  private fun buildMultipartHeader(
    boundary: String,
    fields: Map<String, String>,
    fileFieldName: String,
    fileName: String,
    mimeType: String?,
  ): ByteArray {
    val out = StringBuilder()
    fields.forEach { (name, value) ->
      out.append("--").append(boundary).append("\r\n")
      out.append("Content-Disposition: form-data; name=\"").append(name.escapeQuotes()).append("\"\r\n")
      // multipart 解析器默认 latin1，非 ASCII 要显式声明 charset。
      if (value.any { it.code > 127 }) {
        out.append("content-type: text/plain; charset=utf-8\r\n")
        out.append("content-transfer-encoding: binary\r\n")
      }
      out.append("\r\n")
      out.append(value).append("\r\n")
    }
    out.append("--").append(boundary).append("\r\n")
    out.append("Content-Disposition: form-data; name=\"")
      .append(fileFieldName.escapeQuotes())
      .append("\"; filename=\"")
      .append(fileName.escapeQuotes())
      .append("\"\r\n")
    out.append("Content-Type: ").append(mimeType ?: "application/octet-stream").append("\r\n")
    out.append("\r\n")
    return out.toString().toByteArray(Charsets.UTF_8)
  }

  // RFC 7578 §4.2：引号里的文件名不能带裸 CR/LF，否则会截断 part header。
  private fun String.escapeQuotes(): String = replace("\"", "%22").replace("\r", "%0D").replace("\n", "%0A")

  /** 依次喂 header、文件字节、footer，同时只占一个缓冲区。 */
  private class FileUploadProvider(
    private val file: File,
    private val header: ByteArray,
    private val footer: ByteArray,
    private val fileLength: Long,
    private val onProgress: ((Long, Long) -> Unit)?,
  ) : UploadDataProvider() {

    private val totalLength: Long = header.size.toLong() + fileLength + footer.size.toLong()

    private var stream: FileInputStream? = null
    private var headerRemaining = 0
    private var fileRemaining = 0L
    private var footerRemaining = 0
    private var bytesSent = 0L

    /** 已交给 Cronet 的 body 字节数。 */
    val sentBytes: Long get() = maxReported
    private var lastReported = 0L

    /** onProgress 报过的最大值，rewind() 之后不清零。 */
    private var maxReported = 0L
    private var scratch = ByteArray(0)

    /** 每次 read() 刷新，调用方靠它发现传输卡住。 */
    @Volatile var lastProgressAtNanos: Long = System.nanoTime()
      private set

    /** [getLength] 承诺的字节全部交完之后为真。 */
    @Volatile var bodyComplete: Boolean = false
      private set

    /** FileInputStream 并发读写不安全。 */
    private val ioLock = Any()

    override fun getLength(): Long = totalLength

    override fun rewind(uploadDataSink: UploadDataSink) {
      // 不回调 sink 会让流停在 REWIND。
      val failure = try {
        openStream()
        null
      } catch (e: Exception) {
        IOException("Failed to rewind ${file.path}", e)
      }
      runCatching {
        if (failure == null) {
          uploadDataSink.onRewindSucceeded()
        } else {
          uploadDataSink.onRewindError(failure)
        }
      }
    }

    /// Cronet 只在重放 body 时调 [rewind]。
    fun resetForFirstRead() {
      openStream()
    }

    private fun openStream() {
      synchronized(ioLock) {
        closeStreamLocked()
        headerRemaining = header.size
        fileRemaining = fileLength
        footerRemaining = footer.size
        bytesSent = 0
        lastReported = 0
        bodyComplete = false
        stream = FileInputStream(file)
      }
    }


    override fun read(sink: UploadDataSink, buffer: ByteBuffer) {
      lastProgressAtNanos = System.nanoTime()
      try {
        var wrote = 0
        val capacity = buffer.remaining()

        // 1) multipart 前导（字段头 + 文件部分头）
        if (headerRemaining > 0 && wrote < capacity) {
          val chunk = minOf(headerRemaining, capacity)
          val offset = header.size - headerRemaining
          buffer.put(header, offset, chunk)
          headerRemaining -= chunk
          wrote += chunk
        }

        // 2) 文件内容，直接从磁盘读
        if (fileRemaining > 0 && wrote < capacity) {
          val want = minOf(fileRemaining, (capacity - wrote).toLong()).toInt()
          // direct buffer 没有底层数组。
          if (scratch.size < want) {
            scratch = ByteArray(want)
          }
          val read = synchronized(ioLock) { stream?.read(scratch, 0, want) } ?: -1
          if (read <= 0) {
            // 文件被截短了。
            sink.onReadError(IOException("Unexpected EOF reading ${file.path}"))
            return
          }
          buffer.put(scratch, 0, read)
          fileRemaining -= read
          wrote += read
        }

        // 3) 结束边界
        if (footerRemaining > 0 && wrote < capacity) {
          val chunk = minOf(footerRemaining, capacity)
          val offset = footer.size - footerRemaining
          buffer.put(footer, offset, chunk)
          footerRemaining -= chunk
          wrote += chunk
        }

        if (wrote == 0) {
          // 非分块上传不能用 finalChunk=true。
          sink.onReadError(
            IOException("Upload body exhausted at $bytesSent of $totalLength bytes"),
          )
          return
        }

        bytesSent += wrote
        if (bytesSent >= totalLength) {
          bodyComplete = true
        }
        onProgress?.let { report(it) }
        sink.onReadSucceeded(false)
      } catch (e: IOException) {
        reportReadError(sink, e)
      } catch (e: Exception) {
        reportReadError(sink, IOException(e))
      }
    }

    /**
     * 请求在读取途中被取消时 Cronet 会抛 IllegalStateException，
     * 让它逃出去会打死执行线程，调用方就一直等。
     */
    private fun reportReadError(sink: UploadDataSink, error: Exception) {
      runCatching { sink.onReadError(error) }
    }

    private fun report(cb: (Long, Long) -> Unit) {
      // 每 MiB 回调一次，每次都要过平台通道。
      if (bytesSent - lastReported >= PROGRESS_INTERVAL || bytesSent >= totalLength) {
        lastReported = bytesSent
        // rewind() 会把 bytesSent 清零，进度不能倒退。
        if (bytesSent > maxReported) {
          maxReported = bytesSent
          cb(bytesSent, totalLength)
        }
      }
    }

    fun closeStream() {
      synchronized(ioLock) { closeStreamLocked() }
    }

    private fun closeStreamLocked() {
      try {
        stream?.close()
      } catch (_: IOException) {
      }
      stream = null
    }

    override fun close() {
      closeStream()
    }

    companion object {
      private const val PROGRESS_INTERVAL = 1L * 1024 * 1024
    }
  }

  companion object {
    private const val BUFFER_SIZE = 256 * 1024

    /**
     * 保留的响应体上限，防代理或服务器返回超大错误页。
     */
    private const val MAX_RESPONSE_BYTES = 1024 * 1024

    /** Floor for the absolute cap on one upload attempt. */
    private const val MIN_UPLOAD_TIMEOUT_SECONDS = 60L * 30

    /**
     * 估算超时用的最差吞吐，字节/秒。故意取低：健康上传被误判超时，
     * 比多等一会儿更糟。
     */
    private const val ASSUMED_MIN_BYTES_PER_SECOND = 64L * 1024

    /** Give up when the body has not advanced at all for this long. */
    private const val IDLE_TIMEOUT_MS = 60_000L

    /** Cap that grows with the file so large uploads are not cut off mid-transfer. */
    private fun uploadTimeoutSeconds(fileLength: Long): Long {
      val estimated = fileLength / ASSUMED_MIN_BYTES_PER_SECOND
      return maxOf(MIN_UPLOAD_TIMEOUT_SECONDS, estimated)
    }
  }
}
