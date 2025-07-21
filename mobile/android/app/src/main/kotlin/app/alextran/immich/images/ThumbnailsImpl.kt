package app.alextran.immich.images

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.graphics.*
import android.media.MediaMetadataRetriever
import android.media.ThumbnailUtils
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import java.nio.ByteBuffer
import kotlin.math.max
import java.util.concurrent.Executors

class ThumbnailsImpl(context: Context) : ThumbnailApi {
  private val ctx: Context = context.applicationContext
  private val contentResolver: ContentResolver = ctx.contentResolver
  private val threadPool =
    Executors.newFixedThreadPool(max(4, Runtime.getRuntime().availableProcessors()))

  companion object {
    val PROJECTION = arrayOf(
      MediaStore.MediaColumns.DATE_MODIFIED,
      MediaStore.Files.FileColumns.MEDIA_TYPE,
    )
    const val SELECTION = "${MediaStore.MediaColumns._ID} = ?"
    val URI: Uri = MediaStore.Files.getContentUri("external")

    const val MEDIA_TYPE_IMAGE = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
    const val MEDIA_TYPE_VIDEO = MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO

    init {
      System.loadLibrary("native_buffer")
    }

    @JvmStatic
    external fun wrapPointer(address: Long, capacity: Int): ByteBuffer
  }

  override fun setThumbnailToBuffer(
    pointer: Long,
    assetId: String,
    width: Long,
    height: Long,
    callback: (Result<Unit>) -> Unit
  ) {
    threadPool.execute {
      try {
        val targetWidth = width.toInt()
        val targetHeight = height.toInt()

        val cursor = contentResolver.query(URI, PROJECTION, SELECTION, arrayOf(assetId), null)
          ?: return@execute callback(Result.failure(RuntimeException("Asset not found")))

        cursor.use { c ->
          if (!c.moveToNext()) {
            return@execute callback(Result.failure(RuntimeException("Asset not found")))
          }

          val mediaType = c.getInt(1)
          val bitmap = when (mediaType) {
            MEDIA_TYPE_IMAGE -> decodeImageThumbnail(assetId, targetWidth, targetHeight)
            MEDIA_TYPE_VIDEO -> decodeVideoThumbnail(assetId, targetWidth, targetHeight)
            else -> return@execute callback(Result.failure(RuntimeException("Unsupported media type")))
          }

          val croppedBitmap = ThumbnailUtils.extractThumbnail(
            bitmap,
            targetWidth,
            targetHeight,
            ThumbnailUtils.OPTIONS_RECYCLE_INPUT
          )
          val buffer = wrapPointer(pointer, (width * height * 4).toInt())
          croppedBitmap.copyPixelsToBuffer(buffer)
          croppedBitmap.recycle()
          callback(Result.success(Unit))
        }
      } catch (e: Exception) {
        callback(Result.failure(e))
      }
    }
  }

  private fun decodeImageThumbnail(assetId: String, targetWidth: Int, targetHeight: Int): Bitmap {
    val uri =
      ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, assetId.toLong())
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      contentResolver.loadThumbnail(uri, Size(targetWidth, targetHeight), null)
    } else {
      decodeSampledBitmap(uri, targetWidth, targetHeight)
    }
  }

  private fun decodeVideoThumbnail(assetId: String, targetWidth: Int, targetHeight: Int): Bitmap {
    val uri =
      ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, assetId.toLong())
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      return contentResolver.loadThumbnail(uri, Size(targetWidth, targetHeight), null)
    }

    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(ctx, uri)
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        retriever.getScaledFrameAtTime(
          0L,
          MediaMetadataRetriever.OPTION_NEXT_SYNC,
          targetWidth,
          targetHeight
        )
      } else {
        retriever.getFrameAtTime(0L)
      } ?: throw RuntimeException("Failed to extract video frame")
    } finally {
      retriever.release()
    }
  }

  private fun decodeSampledBitmap(uri: Uri, targetWidth: Int, targetHeight: Int): Bitmap {
    val options = BitmapFactory.Options().apply {
      inJustDecodeBounds = true
    }

    contentResolver.openInputStream(uri)?.use { stream ->
      BitmapFactory.decodeStream(stream, null, options)
    }

    options.apply {
      inSampleSize = getSampleSize(this, targetWidth, targetHeight)
      inJustDecodeBounds = false
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }

    return contentResolver.openInputStream(uri)?.use { stream ->
      BitmapFactory.decodeStream(stream, null, options)
    } ?: throw RuntimeException("Failed to decode bitmap")
  }

  private fun getSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
    val height = options.outHeight
    val width = options.outWidth
    var inSampleSize = 1

    if (height > reqHeight || width > reqWidth) {
      val halfHeight = height / 2
      val halfWidth = width / 2

      while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
        inSampleSize *= 2
      }
    }

    return inSampleSize
  }
}
