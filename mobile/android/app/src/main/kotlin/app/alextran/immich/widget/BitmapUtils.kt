package app.alextran.immich.widget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import app.alextran.immich.images.calculateInSampleSize
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
