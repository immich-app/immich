package app.alextran.immich.widget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import java.io.File

fun loadScaledBitmap(file: File, reqWidth: Int, reqHeight: Int): Bitmap? {
  val options = BitmapFactory.Options().apply {
    inJustDecodeBounds = true
  }
  BitmapFactory.decodeFile(file.absolutePath, options)

  options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
  options.inJustDecodeBounds = false

  return BitmapFactory.decodeFile(file.absolutePath, options)
}

fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
  val (height: Int, width: Int) = options.run { outHeight to outWidth }
  var inSampleSize = 1

  if (height > reqHeight || width > reqWidth) {
    val halfHeight: Int = height / 2
    val halfWidth: Int = width / 2

    while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
      inSampleSize *= 2
    }
  }

  return inSampleSize
}

fun applyBlackWhiteFilter(src: Bitmap): Bitmap {

    val config = src.config ?: Bitmap.Config.ARGB_8888
    val outputBitmap = Bitmap.createBitmap(src.width, src.height, config)
    outputBitmap.setHasAlpha(src.hasAlpha())
    
    val canvas = Canvas(outputBitmap)

    val paint = Paint().apply {
        isFilterBitmap = true
        val colorMatrix = ColorMatrix().apply {
            setSaturation(0f)
        }
        colorFilter = ColorMatrixColorFilter(colorMatrix)
    }
    
    canvas.drawBitmap(src, 0f, 0f, paint)

    return outputBitmap
}