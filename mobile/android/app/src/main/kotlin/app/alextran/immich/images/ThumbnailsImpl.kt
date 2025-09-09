package app.alextran.immich.images

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.res.Resources
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.OperationCanceledException
import android.provider.DocumentsContract
import android.provider.MediaStore.Images
import android.provider.MediaStore.Video
import android.system.Int64Ref
import android.util.Size
import androidx.annotation.RequiresApi
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
      loadThumbnail(uri, Size(targetWidth, targetHeight), signal)
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
      loadThumbnail(uri, Size(targetWidth, targetHeight), signal)
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

  /*
   * Copyright (C) 2006 The Android Open Source Project
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  @RequiresApi(Build.VERSION_CODES.Q)
  fun loadThumbnail(uri: Uri, size: Size, signal: CancellationSignal?): Bitmap {
    // Convert to Point, since that's what the API is defined as
    val opts = Bundle()
    if (size.width < 512 && size.height < 512) {
      opts.putParcelable(ContentResolver.EXTRA_SIZE, Point(size.width, size.height))
    }
    val orientation = Int64Ref(0)

    var bitmap =
      ImageDecoder.decodeBitmap(
        ImageDecoder.createSource {
          val afd =
            resolver.openTypedAssetFile(uri, "image/*", opts, signal)
              ?: throw Resources.NotFoundException("Asset $uri not found")
          val extras = afd.extras
          orientation.value =
            (extras?.getInt(DocumentsContract.EXTRA_ORIENTATION, 0) ?: 0).toLong()
          afd
        }
      ) { decoder: ImageDecoder, info: ImageDecoder.ImageInfo, _: ImageDecoder.Source ->
        decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE)
        // One last-ditch check to see if we've been canceled.
        signal?.throwIfCanceled()

        // We requested a rough thumbnail size, but the remote size may have
        // returned something giant, so defensively scale down as needed.
        // This is modified from the original to target the smaller edge instead of the larger edge.
        val widthSample = info.size.width.toDouble() / size.width
        val heightSample = info.size.height.toDouble() / size.height
        val sample = min(widthSample, heightSample)
        if (sample > 1) {
          val width = (info.size.width / sample).toInt()
          val height = (info.size.height / sample).toInt()
          decoder.setTargetSize(width, height)
        }
      }

    // Transform the bitmap if requested. We use a side-channel to
    // communicate the orientation, since EXIF thumbnails don't contain
    // the rotation flags of the original image.
    if (orientation.value != 0L) {
      val width = bitmap.getWidth()
      val height = bitmap.getHeight()

      val m = Matrix()
      m.setRotate(orientation.value.toFloat(), (width / 2).toFloat(), (height / 2).toFloat())
      bitmap = Bitmap.createBitmap(bitmap, 0, 0, width, height, m, false)
    }

    return bitmap
  }
}
