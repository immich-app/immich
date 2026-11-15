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
 * Streams a single `multipart/form-data` upload straight from disk through Cronet.
 *
 * `package:cronet_http` materialises the whole request body in memory before
 * handing it to the native layer, so payloads larger than the heap cannot be
 * uploaded through it. Cronet's own [UploadDataProvider] API is streaming.
 */
internal class StreamingFileUploader(
  private val engine: CronetEngine,
  private val executor: ExecutorService,
) {

  /** Outcome of one upload attempt. */
  data class Outcome(
    val isSuccess: Boolean,
    val statusCode: Int,
    val body: String?,
    val errorMessage: String?,
    /** Body bytes handed to Cronet, used by Dart to decide whether a resend is safe. */
    val bytesSent: Long = 0,
  ) {
    fun withSentBytes(sent: Long): Outcome = if (bytesSent == sent) this else copy(bytesSent = sent)
  }

  /**
   * Live requests keyed by progress key, so Dart can abort an upload when the
   * backup is cancelled (app paused, worker stopped, user hit stop). Without this
   * the native thread would keep uploading after the caller moved on.
   */
  private val activeRequests = java.util.concurrent.ConcurrentHashMap<String, UrlRequest>()

  /**
   * Keys cancelled before their request was registered. Without a tombstone a
   * cancel that arrives while the request is still being built is dropped.
   */
  private val cancelRequested = java.util.concurrent.ConcurrentHashMap.newKeySet<String>()

  fun cancel(progressKey: String) {
    cancelRequested.add(progressKey)
    activeRequests.remove(progressKey)?.let {
      runCatching { it.cancel() }
    }
  }

  /**
   * Upload [file] to [url] as multipart/form-data.
   *
   * @param onProgress called with (bytesSent, totalBytes) as the body drains.
   * @return the outcome; never throws for transport or HTTP failures.
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
      // A cancel can arrive between the Dart call and this point. The tombstone is
      // added by cancel() before upload() runs, so it must be cleared here -- this
      // return precedes the try/finally that normally removes it.
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

    // Set when we refuse to follow a redirect, so onCanceled can explain why.
    var rejectReason: String? = null

    val callback = object : UrlRequest.Callback() {
      override fun onRedirectReceived(request: UrlRequest, info: UrlResponseInfo, newLocationUrl: String) {
        // 301/302/303 rewrite POST to GET and drop the body, so following them
        // would upload nothing. Only 307/308 preserve the method and body.
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
          // A successful upload answers with a small JSON body; anything larger is
          // an error page. Cap what is kept so a huge response cannot exhaust the
          // heap.
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
        // Cronet wraps the real cause (our own IOException, a socket error, ...),
        // so flatten the chain; the wrapper text alone tells the user nothing.
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

      // Auth and any other persisted headers. Cronet strips these from the URL
      // rather than reading them off the request, so set them explicitly.
      HttpClientManager.getAuthHeaders(url).forEach { (key, value) ->
        if (!key.equals("content-length", ignoreCase = true) &&
          !key.equals("content-type", ignoreCase = true)
        ) {
          builder.addHeader(key, value)
        }
      }
      builder.addHeader("Content-Type", "multipart/form-data; boundary=$boundary")

      // Cronet only calls rewind() when it needs to replay the body (redirects,
      // auth challenges). Prime the provider so the first read has data.
      provider.resetForFirstRead()

      val builtRequest = builder
        .setHttpMethod("POST")
        .setUploadDataProvider(provider, executor)
        .build()
      request = builtRequest
      activeRequests[progressKey] = builtRequest
      // start() must come before any cancel(): CronetUrlRequest.cancel() is a
      // no-op while !mStarted, and it would not fire onCanceled either.
      builtRequest.start()
      // Honour a cancel that arrived while the request was being built.
      if (cancelRequested.remove(progressKey)) {
        runCatching { builtRequest.cancel() }
      }

      // A missing callback would wedge the calling thread forever. Poll rather
      // than await(): a transfer stalled at 30% would otherwise sit here for the
      // full timeout. The idle check is the real stall detector; the cap only
      // bounds runaway duration and scales with the file.
      val hardDeadlineNanos = System.nanoTime() + uploadTimeoutSeconds(fileLength) * 1_000_000_000L
      var finished = false
      while (true) {
        if (latch.await(1, java.util.concurrent.TimeUnit.SECONDS)) {
          finished = true
          break
        }
        val now = System.nanoTime()
        val idleMs = (now - provider.lastProgressAtNanos) / 1_000_000L
        // Only treat silence as a stall while body bytes are still owed. Once the
        // body is on the wire the server may take a long time to reply.
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
      // Remove by identity so a retry that reuses the key keeps its own entry.
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
      // Multipart parsers default to latin1, so a non-ASCII field value needs this
      // charset header or it would be mangled. The header set must stay equivalent
      // to the Dart path.
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

  // RFC 7578 §4.2: a quoted filename must not contain a bare CR or LF, or it can
  // terminate the part header early. Percent-encode rather than rely on backslash
  // escapes, which the RFC does not define.
  private fun String.escapeQuotes(): String = replace("\"", "%22").replace("\r", "%0D").replace("\n", "%0A")

  /**
   * Feeds header, file bytes, then footer to Cronet without holding more than one
   * buffer of the payload in memory.
   */
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

    /**
     * Body bytes handed to Cronet so far, for the caller's resend decision.
     *
     * [maxReported] rather than [bytesSent]: rewind() resets the latter, so a
     * rewound transfer would otherwise look like it sent nothing.
     */
    val sentBytes: Long get() = maxReported
    private var lastReported = 0L

    /** Highest value ever handed to onProgress; survives rewind(). */
    private var maxReported = 0L
    private var scratch = ByteArray(0)

    /** Refreshed on every read() so the caller can detect a stalled transfer. */
    @Volatile var lastProgressAtNanos: Long = System.nanoTime()
      private set

    /**
     * True once every byte promised by [getLength] has been handed to Cronet.
     * After that [lastProgressAtNanos] freezes, so silence must no longer count as
     * a stall -- the server may still be processing a large body.
     */
    @Volatile var bodyComplete: Boolean = false
      private set

    /**
     * Guards [stream] against the upload thread reading while the caller closes it
     * after a timeout or cancel. FileInputStream is not safe for concurrent
     * read/close.
     */
    private val ioLock = Any()

    override fun getLength(): Long = totalLength

    override fun rewind(uploadDataSink: UploadDataSink) {
      // Cronet blocks the request until the sink reports back; returning without
      // calling one leaves the stream parked in REWIND forever.
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

    /// Primes the provider for the first read. Cronet only calls [rewind] itself
    /// when it must replay the body, so the very first read needs this too.
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

        // 1) multipart preamble (field headers + file part header)
        if (headerRemaining > 0 && wrote < capacity) {
          val chunk = minOf(headerRemaining, capacity)
          val offset = header.size - headerRemaining
          buffer.put(header, offset, chunk)
          headerRemaining -= chunk
          wrote += chunk
        }

        // 2) file payload, read straight off disk
        if (fileRemaining > 0 && wrote < capacity) {
          val want = minOf(fileRemaining, (capacity - wrote).toLong()).toInt()
          // Cronet hands us a direct buffer, which has no backing array, so read
          // into a scratch array and copy across.
          if (scratch.size < want) {
            scratch = ByteArray(want)
          }
          val read = synchronized(ioLock) { stream?.read(scratch, 0, want) } ?: -1
          if (read <= 0) {
            // Disk truncated underneath us; fail loudly rather than sending a
            // short body that the server would reject with a confusing error.
            sink.onReadError(IOException("Unexpected EOF reading ${file.path}"))
            return
          }
          buffer.put(scratch, 0, read)
          fileRemaining -= read
          wrote += read
        }

        // 3) closing boundary
        if (footerRemaining > 0 && wrote < capacity) {
          val chunk = minOf(footerRemaining, capacity)
          val offset = footer.size - footerRemaining
          buffer.put(footer, offset, chunk)
          footerRemaining -= chunk
          wrote += chunk
        }

        if (wrote == 0) {
          // The provider ran out of data before the byte count promised by
          // getLength(). finalChunk=true is illegal for a non-chunked upload, and
          // succeeding silently would leave a truncated body on the server.
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
     * Cronet throws IllegalStateException when the sink is no longer in the READ
     * state (request cancelled mid-read). Letting that escape would kill the
     * executor thread and strand the waiting caller.
     */
    private fun reportReadError(sink: UploadDataSink, error: Exception) {
      runCatching { sink.onReadError(error) }
    }

    private fun report(cb: (Long, Long) -> Unit) {
      // Throttle: progress callbacks cross the platform channel, so firing one
      // per 64 KiB buffer would flood the message loop on a large upload.
      if (bytesSent - lastReported >= PROGRESS_INTERVAL || bytesSent >= totalLength) {
        lastReported = bytesSent
        // rewind() resets bytesSent to 0, so never report below what the UI has
        // already shown -- a retried upload would make the bar jump backwards.
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
     * Upper bound on the response body kept in memory, guarding against a proxy or
     * server sending an enormous error page.
     */
    private const val MAX_RESPONSE_BYTES = 1024 * 1024

    /** Floor for the absolute cap on one upload attempt. */
    private const val MIN_UPLOAD_TIMEOUT_SECONDS = 60L * 30

    /**
     * Assumed worst-case throughput used to size the cap, in bytes per second.
     * Deliberately pessimistic: a false timeout on a healthy upload is worse than
     * waiting longer.
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
