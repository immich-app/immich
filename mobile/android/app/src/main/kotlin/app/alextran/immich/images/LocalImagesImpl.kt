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
import androidx.annotation.RequiresApi
import app.alextran.immich.NativeBuffer
import kotlin.math.*
import java.io.IOException
import java.util.concurrent.Executors
import com.bumptech.glide.Glide
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.request.target.Target.SIZE_ORIGINAL
import java.util.Base64
import java.util.concurrent.CancellationException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future

data class Request(
  val taskFuture: Future<*>,
  val cancellationSignal: CancellationSignal,
  val callback: (Result<Map<String, Long>?>) -> Unit
)

@RequiresApi(Build.VERSION_CODES.Q)
inline fun ImageDecoder.Source.decodeBitmap(target: Size = Size(0, 0)): Bitmap {
  return ImageDecoder.decodeBitmap(this) { decoder, info, _ ->
    if (target.width > 0 && target.height > 0) {
      val sample = max(1, min(info.size.width / target.width, info.size.height / target.height))
      decoder.setTargetSampleSize(sample)
    }
    decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
    decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
  }
}

fun Bitmap.toNativeBuffer(): Map<String, Long>  {
  val size = width * height * 4
  val pointer = NativeBuffer.allocate(size)
  try {
    val buffer = NativeBuffer.wrap(pointer, size)
    copyPixelsToBuffer(buffer)
    return mapOf(
      "pointer" to pointer,
      "width" to width.toLong(),
      "height" to height.toLong(),
      "rowBytes" to (width * 4).toLong()
    )
  } catch (e: Exception) {
    NativeBuffer.free(pointer)
    throw e
  } finally {
    recycle()
  }
}

class LocalImagesImpl(context: Context) : LocalImageApi {
  private val ctx: Context = context.applicationContext
  private val resolver: ContentResolver = ctx.contentResolver
  private val requestThread = Executors.newSingleThreadExecutor()
  private val threadPool =
    Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() / 2 + 1)
  private val requestMap = ConcurrentHashMap<Long, Request>()

  companion object {
    val CANCELLED = Result.success<Map<String, Long>?>(null)
    val OPTIONS = BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }
  }

  override fun getThumbhash(thumbhash: String, callback: (Result<Map<String, Long>>) -> Unit) {
    threadPool.execute {
      try {
        val bytes = Base64.getDecoder().decode(thumbhash)
        val image = ThumbHash.thumbHashToRGBA(bytes)
        val res = mapOf(
          "pointer" to image.pointer,
          "width" to image.width.toLong(),
          "height" to image.height.toLong(),
          "rowBytes" to (image.width * 4).toLong()
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
    preferEncoded: Boolean,
    callback: (Result<Map<String, Long>?>) -> Unit
  ) {
    val signal = CancellationSignal()
    val task = threadPool.submit {
      try {
        if (preferEncoded) {
          getEncodedImageInternal(assetId, callback, signal)
        } else {
          getThumbnailBufferInternal(assetId, width, height, isVideo, callback, signal)
        }
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

  override fun cancelRequest(requestId: Long) {
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

  private fun getEncodedImageInternal(
    assetId: String,
    callback: (Result<Map<String, Long>?>) -> Unit,
    signal: CancellationSignal
  ) {
    signal.throwIfCanceled()
    val id = assetId.toLong()
    val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, id)

    signal.throwIfCanceled()
    val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
      ?: throw IOException("Could not read image data for $assetId")

    signal.throwIfCanceled()
    val pointer = NativeBuffer.allocate(bytes.size)
    try {
      val buffer = NativeBuffer.wrap(pointer, bytes.size)
      buffer.put(bytes)
      signal.throwIfCanceled()
      callback(Result.success(mapOf(
        "pointer" to pointer,
        "length" to bytes.size.toLong()
      )))
    } catch (e: Exception) {
      NativeBuffer.free(pointer)
      throw e
    }
  }

  private fun getThumbnailBufferInternal(
    assetId: String,
    width: Long,
    height: Long,
    isVideo: Boolean,
    callback: (Result<Map<String, Long>?>) -> Unit,
    signal: CancellationSignal
  ) {
    signal.throwIfCanceled()
    val size = Size(width.toInt(), height.toInt())
    val id = assetId.toLong()

    signal.throwIfCanceled()
    val bitmap = if (isVideo) {
      decodeVideoThumbnail(id, size, signal)
    } else {
      decodeImage(id, size, signal)
    }

    try {
      signal.throwIfCanceled()
      val res = bitmap.toNativeBuffer()
      signal.throwIfCanceled()
      callback(Result.success(res))
    } catch (e: Exception) {
      callback(if (e is OperationCanceledException) CANCELLED else Result.failure(e))
    }
  }

  private fun decodeImage(id: Long, size: Size, signal: CancellationSignal): Bitmap {
    signal.throwIfCanceled()
    val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, id)
    if (size.width <= 0 || size.height <= 0 || size.width > 768 || size.height > 768) {
      return decodeSource(uri, size, signal)
    }

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      resolver.loadThumbnail(uri, size, signal)
    } else {
      signal.setOnCancelListener { Images.Thumbnails.cancelThumbnailRequest(resolver, id) }
      Images.Thumbnails.getThumbnail(resolver, id, Images.Thumbnails.MINI_KIND, OPTIONS)
    }
  }

  private fun decodeVideoThumbnail(id: Long, target: Size, signal: CancellationSignal): Bitmap {
    signal.throwIfCanceled()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val uri = ContentUris.withAppendedId(Video.Media.EXTERNAL_CONTENT_URI, id)
      // ensure a valid resolution as the thumbnail is used for videos even when no scaling is needed
      val size = if (target.width > 0 && target.height > 0) target else Size(768, 768)
      resolver.loadThumbnail(uri, size, signal)
    } else {
      signal.setOnCancelListener { Video.Thumbnails.cancelThumbnailRequest(resolver, id) }
      Video.Thumbnails.getThumbnail(resolver, id, Video.Thumbnails.MINI_KIND, OPTIONS)
    }
  }

  private fun decodeSource(uri: Uri, target: Size, signal: CancellationSignal): Bitmap {
    signal.throwIfCanceled()
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ImageDecoder.createSource(resolver, uri).decodeBitmap(target)
    } else {
      val ref =
        Glide.with(ctx).asBitmap().priority(Priority.IMMEDIATE).load(uri).disallowHardwareConfig()
          .format(DecodeFormat.PREFER_ARGB_8888).submit(
            if (target.width > 0) target.width else SIZE_ORIGINAL,
            if (target.height > 0) target.height else SIZE_ORIGINAL,
          )
      signal.setOnCancelListener { Glide.with(ctx).clear(ref) }
      ref.get()
    }
  }
}
