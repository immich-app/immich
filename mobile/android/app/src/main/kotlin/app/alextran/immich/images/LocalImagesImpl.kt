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
import androidx.exifinterface.media.ExifInterface
import app.alextran.immich.NativeBuffer
import app.alextran.immich.NativeImage
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

    // "Load original" decodes a raw at full res, and the orientation pass then walks every pixel, so
    // cap the decode resolution to keep that bounded on huge DNGs. This only trims pixels on very
    // large raws - they still come out upright, just downsampled.
    const val MAX_RAW_DECODE_PIXELS = 24_000_000L
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
    try {
      val res = if (isVideo) {
        decodeVideoThumbnail(id, size, signal).toNativeBuffer()
      } else {
        val (bitmap, orientation) = decodeImage(id, size, signal)
        signal.throwIfCanceled()
        if (orientation == ExifInterface.ORIENTATION_NORMAL || orientation == ExifInterface.ORIENTATION_UNDEFINED) {
          bitmap.toNativeBuffer()
        } else {
          rotateToNativeBuffer(bitmap, orientation, signal)
        }
      }
      // Don't re-check cancellation here: res owns a malloc'd buffer, and bailing to CANCELLED would
      // orphan it. Deliver it; Dart frees the buffer itself if the request was cancelled meanwhile.
      callback(Result.success(res))
    } catch (e: Exception) {
      callback(if (e is OperationCanceledException) CANCELLED else Result.failure(e))
    }
  }

  // Returns the decoded bitmap plus the EXIF orientation that still needs applying. Only Q+ raw
  // decodes come back unrotated (ImageDecoder / loadThumbnail skip EXIF for raw like DNG); every
  // other path already orients itself, so it reports ORIENTATION_NORMAL.
  private fun decodeImage(id: Long, size: Size, signal: CancellationSignal): Pair<Bitmap, Int> {
    signal.throwIfCanceled()
    val uri = ContentUris.withAppendedId(Images.Media.EXTERNAL_CONTENT_URI, id)
    val handleRaw = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && isRawMime(uri)
    val orientation = if (handleRaw) rawOrientation(uri) else ExifInterface.ORIENTATION_NORMAL

    if (size.width <= 0 || size.height <= 0 || size.width > 768 || size.height > 768) {
      // A "load original" request is unsized -> a full-res decode. For raw, cap it so the later
      // orientation pass stays within a safe pixel budget.
      val bitmap = if (handleRaw && (size.width <= 0 || size.height <= 0)) {
        decodeRawCapped(uri, signal)
      } else {
        decodeSource(uri, size, signal)
      }
      return bitmap to orientation
    }

    val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      resolver.loadThumbnail(uri, size, signal)
    } else {
      signal.setOnCancelListener { Images.Thumbnails.cancelThumbnailRequest(resolver, id) }
      Images.Thumbnails.getThumbnail(resolver, id, Images.Thumbnails.MINI_KIND, OPTIONS)
    }
    return bitmap to orientation
  }

  private fun isRawMime(uri: Uri): Boolean {
    val mime = resolver.getType(uri) ?: return false
    return mime.startsWith("image/x-") || mime == "image/dng"
  }

  private fun rawOrientation(uri: Uri): Int {
    return resolver.openInputStream(uri)?.use {
      ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    } ?: ExifInterface.ORIENTATION_NORMAL
  }

  // Full-res raw decode for "load original", sampled down to MAX_RAW_DECODE_PIXELS (power of two).
  // Caps resolution only; the caller still rotates the result, so even huge raws end up upright.
  @RequiresApi(Build.VERSION_CODES.Q)
  private fun decodeRawCapped(uri: Uri, signal: CancellationSignal): Bitmap {
    signal.throwIfCanceled()
    return ImageDecoder.decodeBitmap(ImageDecoder.createSource(resolver, uri)) { decoder, info, _ ->
      val pixels = info.size.width.toLong() * info.size.height.toLong()
      var sample = 1
      while (pixels / (sample.toLong() * sample) > MAX_RAW_DECODE_PIXELS) {
        sample *= 2
      }
      if (sample > 1) {
        decoder.setTargetSampleSize(sample)
      }
      decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
      decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
    }
  }

  // ImageDecoder / loadThumbnail skip EXIF orientation for raw (e.g. DNG) on Q+, so the decoded
  // bitmap comes back unrotated. Rotate it into the output buffer in native code (one pass, no
  // intermediate rotated bitmap), falling back to Skia for any config the native path can't take.
  private fun rotateToNativeBuffer(bitmap: Bitmap, orientation: Int, signal: CancellationSignal): Map<String, Long> {
    signal.throwIfCanceled()
    // Force ARGB_8888 so both the native pass and the Skia fallback are 4 bytes/pixel: the native
    // rotate needs a lockable 8888 buffer, and toNativeBuffer() below allocates width*height*4 (an
    // F16/HDR decode would otherwise under-allocate). No-op for the common already-8888 case.
    val src = if (bitmap.config != Bitmap.Config.ARGB_8888) {
      val converted = bitmap.copy(Bitmap.Config.ARGB_8888, false)
      bitmap.recycle()
      converted ?: throw IOException("could not convert bitmap to ARGB_8888")
    } else {
      bitmap
    }
    try {
      val info = IntArray(3)
      val pointer = NativeImage.rotate(src, orientation, info)
      if (pointer != 0L) {
        return mapOf(
          "pointer" to pointer,
          "width" to info[0].toLong(),
          "height" to info[1].toLong(),
          "rowBytes" to info[2].toLong()
        )
      }
      // Native path declined (unsupported config) -> rotate via Skia, then copy out.
      val matrix = matrixForExifOrientation(orientation) ?: return src.toNativeBuffer()
      return Bitmap.createBitmap(src, 0, 0, src.width, src.height, matrix, true).toNativeBuffer()
    } finally {
      if (!src.isRecycled) src.recycle()
    }
  }

  // EXIF orientation (1-8) -> transform matrix, or null when no rotation/flip is needed.
  private fun matrixForExifOrientation(orientation: Int): Matrix? {
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> matrix.apply { postRotate(270f); postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_TRANSVERSE -> matrix.apply { postRotate(90f); postScale(-1f, 1f) }
      else -> return null
    }
    return matrix
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
