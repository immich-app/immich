package app.alextran.immich.widget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
