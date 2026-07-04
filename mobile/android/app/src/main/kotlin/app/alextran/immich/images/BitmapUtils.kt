package app.alextran.immich.images

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect

fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
  val height = options.outHeight
  val width = options.outWidth
  var inSampleSize = 1

  if (height > reqHeight || width > reqWidth) {
    val halfHeight = height / 2
    val halfWidth = width / 2
    while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
      inSampleSize *= 2
    }
  }

  return inSampleSize
}

fun drawBitmapCenterCrop(canvas: Canvas, bitmap: Bitmap, paint: Paint) {
  val canvasWidth = canvas.width
  val canvasHeight = canvas.height
  if (canvasWidth <= 0 || canvasHeight <= 0 || bitmap.width <= 0 || bitmap.height <= 0) {
    return
  }

  val scale = maxOf(
    canvasWidth.toFloat() / bitmap.width.toFloat(),
    canvasHeight.toFloat() / bitmap.height.toFloat(),
  )
  val targetWidth = (bitmap.width * scale).toInt()
  val targetHeight = (bitmap.height * scale).toInt()
  val left = (canvasWidth - targetWidth) / 2
  val top = (canvasHeight - targetHeight) / 2

  val src = Rect(0, 0, bitmap.width, bitmap.height)
  val dst = Rect(left, top, left + targetWidth, top + targetHeight)
  canvas.drawBitmap(bitmap, src, dst, paint)
}
