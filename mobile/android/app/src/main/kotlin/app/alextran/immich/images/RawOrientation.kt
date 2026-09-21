package app.alextran.immich.images

import android.graphics.Bitmap
import androidx.exifinterface.media.ExifInterface
import app.alextran.immich.NativeImage
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

fun readOrientation(input: InputStream): Int =
  ExifInterface(input).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)

// Reads the EXIF orientation (TIFF tag 0x0112) from a raw file's IFD0.
fun readRawOrientation(buffer: ByteBuffer, len: Int): Int {
  try {
    if (len < 8) return ExifInterface.ORIENTATION_NORMAL
    buffer.order(
      when (buffer.get(0).toInt() and 0xFF) {
        0x49 -> ByteOrder.LITTLE_ENDIAN
        0x4D -> ByteOrder.BIG_ENDIAN
        else -> return ExifInterface.ORIENTATION_NORMAL
      }
    )
    val ifd0 = buffer.getInt(4).toLong() and 0xFFFFFFFFL
    if (ifd0 < 8 || ifd0 + 2 > len) return ExifInterface.ORIENTATION_NORMAL
    val start = ifd0.toInt()
    val entries = buffer.getShort(start).toInt() and 0xFFFF
    if (entries <= 0 || entries > 512) return ExifInterface.ORIENTATION_NORMAL
    // Each IFD entry is 12 bytes: tag(2) type(2) count(4) value(4); orientation is a SHORT in value.
    for (i in 0 until entries) {
      val p = start + 2 + i * 12
      if (p + 12 > len) return ExifInterface.ORIENTATION_NORMAL
      if ((buffer.getShort(p).toInt() and 0xFFFF) == 0x0112) {
        val value = buffer.getShort(p + 8).toInt() and 0xFFFF
        return if (value in 1..8) value else ExifInterface.ORIENTATION_NORMAL
      }
    }
    return ExifInterface.ORIENTATION_NORMAL
  } catch (_: Exception) {
    return ExifInterface.ORIENTATION_NORMAL
  }
}

fun Bitmap.toArgb8888(): Bitmap {
  if (config == Bitmap.Config.ARGB_8888) return this
  val converted = copy(Bitmap.Config.ARGB_8888, false)
  recycle()
  return converted ?: throw IOException("could not convert bitmap to ARGB_8888")
}

// Force ARGB_8888 first: the native rotate needs a lockable 8888 buffer and allocates w*h*4.
fun rotateToNativeBuffer(bitmap: Bitmap, orientation: Int): Map<String, Long> {
  val src = bitmap.toArgb8888()
  try {
    val info = IntArray(3)
    val pointer = NativeImage.rotate(src, orientation, info)
    if (pointer == 0L) throw IOException("native rotate failed for orientation $orientation")
    return mapOf(
      "pointer" to pointer,
      "width" to info[0].toLong(),
      "height" to info[1].toLong(),
      "rowBytes" to info[2].toLong()
    )
  } finally {
    if (!src.isRecycled) src.recycle()
  }
}
