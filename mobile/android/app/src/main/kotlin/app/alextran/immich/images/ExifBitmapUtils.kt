package app.alextran.immich.images

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayInputStream

object ExifBitmapUtils {
  fun decodeSampledBitmap(data: ByteArray, targetWidth: Int, targetHeight: Int): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(data, 0, data.size, bounds)

    val options = BitmapFactory.Options().apply {
      inSampleSize = calculateInSampleSize(bounds, targetWidth, targetHeight)
    }
    val bitmap = BitmapFactory.decodeByteArray(data, 0, data.size, options) ?: return null
    val orientation = readOrientation(data)
    return applyOrientation(bitmap, orientation)
  }

  fun decodeSampledBitmap(
    contentResolver: ContentResolver,
    uri: Uri,
    targetWidth: Int,
    targetHeight: Int,
  ): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    contentResolver.openInputStream(uri)?.use { input ->
      BitmapFactory.decodeStream(input, null, bounds)
    } ?: return null

    val orientation = readOrientation(contentResolver, uri)

    val options = BitmapFactory.Options().apply {
      inSampleSize = calculateInSampleSize(bounds, targetWidth, targetHeight)
    }
    val bitmap = contentResolver.openInputStream(uri)?.use { input ->
      BitmapFactory.decodeStream(input, null, options)
    } ?: return null

    return applyOrientation(bitmap, orientation)
  }

  private fun applyOrientation(bitmap: Bitmap, orientation: Int): Bitmap {
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
        matrix.setRotate(180f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_TRANSPOSE -> {
        matrix.setRotate(90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> {
        matrix.setRotate(-90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
      else -> return bitmap
    }

    val oriented = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (oriented !== bitmap) {
      bitmap.recycle()
    }
    return oriented
  }

  private fun readOrientation(data: ByteArray): Int {
    return runCatching {
      ByteArrayInputStream(data).use { input ->
        ExifInterface(input).getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL,
        )
      }
    }.getOrDefault(ExifInterface.ORIENTATION_NORMAL)
  }

  private fun readOrientation(contentResolver: ContentResolver, uri: Uri): Int {
    return runCatching {
      contentResolver.openInputStream(uri)?.use { input ->
        ExifInterface(input).getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL,
        )
      } ?: ExifInterface.ORIENTATION_NORMAL
    }.getOrDefault(ExifInterface.ORIENTATION_NORMAL)
  }

  private fun calculateInSampleSize(options: BitmapFactory.Options, targetWidth: Int, targetHeight: Int): Int {
    val height = options.outHeight
    val width = options.outWidth
    var inSampleSize = 1

    if (height > targetHeight || width > targetWidth) {
      val halfHeight = height / 2
      val halfWidth = width / 2
      while (halfHeight / inSampleSize >= targetHeight && halfWidth / inSampleSize >= targetWidth) {
        inSampleSize *= 2
      }
    }

    return inSampleSize
  }
}
