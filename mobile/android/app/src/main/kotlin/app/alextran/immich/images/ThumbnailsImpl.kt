package app.alextran.immich.images

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.os.CancellationSignal
import android.os.OperationCanceledException
import android.provider.MediaStore.Images
import android.provider.MediaStore.Video
import android.util.Size
import java.nio.ByteBuffer
import kotlin.math.*
import java.util.concurrent.Executors
import com.bumptech.glide.Glide
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DecodeFormat
import java.util.Base64
import java.util.concurrent.CancellationException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future

data class Request(
  val taskFuture: Future<*>,
  val cancellationSignal: CancellationSignal,
  val callback: (Result<Map<String, Long>>) -> Unit
)

class ThumbnailsImpl(context: Context) : ThumbnailApi {
  private val ctx: Context = context.applicationContext
  private val resolver: ContentResolver = ctx.contentResolver
  private val requestThread = Executors.newSingleThreadExecutor()
  private val threadPool =
    Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() / 2 + 1)
  private val requestMap = ConcurrentHashMap<Long, Request>()

  companion object {
    val CANCELLED = Result.success<Map<String, Long>>(mapOf())
    val OPTIONS = BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }

    init {
      System.loadLibrary("native_buffer")
    }

    @JvmStatic
    external fun allocateNative(size: Int): Long

    @JvmStatic
    external fun freeNative(pointer: Long)

    @JvmStatic
    external fun wrapAsBuffer(address: Long, capacity: Int): ByteBuffer
  }

  override fun getThumbhash(thumbhash: String, callback: (Result<Map<String, Long>>) -> Unit) {
    threadPool.execute {
      try {
        val bytes = Base64.getDecoder().decode(thumbhash)
        val image = ThumbHash.thumbHashToRGBA(bytes)
        val res = mapOf(
          "pointer" to image.pointer,
          "width" to image.width.toLong(),
          "height" to image.height.toLong()
        )
        callback(Result.success(res))
      } catch (e: Exception) {
        callback(Result.failure(e))
      }
    }
  }

  override fun requestImage(
    assetId: String,
    requestId: Long,
    width: Long,
    height: Long,
    isVideo: Boolean,
    callback: (Result<Map<String, Long>>) -> Unit
  ) {
    val signal = CancellationSignal()
    val task = threadPool.submit {
      try {
        getThumbnailBufferInternal(assetId, width, height, isVideo, callback, signal)
      } catch (e: Exception) {
        when (e) {
          is OperationCanceledException -> callback(CANCELLED)
          is CancellationException -> callback(CANCELLED)
          else -> callback(Result.failure(e))
        }
      } finally {
        requestMap.remove(requestId)
      }
    }
    val request = Request(task, signal, callback)
    requestMap[requestId] = request
  }

  override fun cancelImageRequest(requestId: Long) {
    val request = requestMap.remove(requestId) ?: return
    request.taskFuture.cancel(false)
    request.cancellationSignal.cancel()
    if (request.taskFuture.isCancelled) {
      requestThread.execute {
        try {
          request.callback(CANCELLED)
        } catch (_: Exception) {
        }
      }
    }
  }

  private fun getThumbnailBufferInternal(
    assetId: String,
    width: Long,
    height: Long,
    isVideo: Boolean,
    callback: (Result<Map<String, Long>>) -> Unit,
    signal: CancellationSignal
  ) {
    signal.throwIfCanceled()
    val targetWidth = width.toInt()
    val targetHeight = height.toInt()
    val id = assetId.toLong()

    signal.throwIfCanceled()
    val bitmap = if (isVideo) {
      decodeVideoThumbnail(id, targetWidth, targetHeight, signal)
    } else {
      decodeImage(id, targetWidth, targetHeight, signal)
    }

    processBitmap(bitmap, callback, signal)
  }

  private fun processBitmap(
    bitmap: Bitmap, callback: (Result<Map<String, Long>>) -> Unit, signal: CancellationSignal
  ) {
    signal.throwIfCanceled()
    val actualWidth = bitmap.width
    val actualHeight = bitmap.height

    val size = actualWidth * actualHeight * 4
    val pointer = allocateNative(size)

    try {
      signal.throwIfCanceled()
      val buffer = wrapAsBuffer(pointer, size)
      bitmap.copyPixelsToBuffer(buffer)
      bitmap.recycle()
      signal.throwIfCanceled()
      val res = mapOf(
        "pointer" to pointer,
        "width" to actualWidth.toLong(),
        "height" to actualHeight.toLong()
      )
      callback(Result.success(res))
    } catch (e: Exception) {
      freeNative(pointer)
      callback(if (e is OperationCanceledException) CANCELLED else Result.failure(e))
    }
  }

  private fun decodeImage(
    id: Long, targetWidth: Int, targetHeight: Int, signal: CancellationSignal
  ): Bitmap {
    signal.throwIfCanceled()
    val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, id)
    if (targetHeight > 768 || targetWidth > 768) {
      return decodeSource(uri, targetWidth, targetHeight, signal)
    }

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      resolver.loadThumbnail(uri, Size(targetWidth, targetHeight), signal)
    } else {
      signal.setOnCancelListener { Images.Thumbnails.cancelThumbnailRequest(resolver, id) }
      Images.Thumbnails.getThumbnail(resolver, id, Images.Thumbnails.MINI_KIND, OPTIONS)
    }
  }

  private fun decodeVideoThumbnail(
    id: Long, targetWidth: Int, targetHeight: Int, signal: CancellationSignal
  ): Bitmap {
    signal.throwIfCanceled()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val uri = ContentUris.withAppendedId(Video.Media.EXTERNAL_CONTENT_URI, id)
      resolver.loadThumbnail(uri, Size(targetWidth, targetHeight), signal)
    } else {
      signal.setOnCancelListener { Video.Thumbnails.cancelThumbnailRequest(resolver, id) }
      Video.Thumbnails.getThumbnail(resolver, id, Video.Thumbnails.MINI_KIND, OPTIONS)
    }
  }

  private fun decodeSource(
    uri: Uri, targetWidth: Int, targetHeight: Int, signal: CancellationSignal
  ): Bitmap {
    signal.throwIfCanceled()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val source = ImageDecoder.createSource(resolver, uri)
      signal.throwIfCanceled()
      ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
        if (targetWidth > 0 && targetHeight > 0) {
          val sample = max(1, min(info.size.width / targetWidth, info.size.height / targetHeight))
          decoder.setTargetSampleSize(sample)
        }
        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
        decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
      }
    } else {
      val ref = Glide.with(ctx).asBitmap().priority(Priority.IMMEDIATE).load(uri)
        .disallowHardwareConfig().format(DecodeFormat.PREFER_ARGB_8888)
        .submit(targetWidth, targetHeight)
      signal.setOnCancelListener { Glide.with(ctx).clear(ref) }
      ref.get()
    }
  }
}
