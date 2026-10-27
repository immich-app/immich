package app.alextran.immich

import android.graphics.Bitmap
import java.nio.ByteBuffer

object NativeImage {
  init {
    System.loadLibrary("native_core_ffi")
  }

  /**
   * Rotates an RGBA_8888 [bitmap] to the given EXIF [orientation], writing the result into a freshly
   * malloc'd native buffer. Returns the buffer address (free it with [NativeBuffer.free]) and fills
   * [outInfo] with {width, height, rowBytes}. Returns 0 when the bitmap can't be handled (e.g. a
   * non-8888 config) so the caller can fall back.
   */
  @JvmStatic
  external fun rotate(bitmap: Bitmap, orientation: Int, outInfo: IntArray): Long

  /**
   * Converts an RGBA_1010102 [bitmap] (what a 10-bit HEIC/AVIF decodes to on API 33+) to RGBA_8888,
   * writing the result into a freshly malloc'd native buffer in one pass, with no intermediate
   * ARGB_8888 bitmap. Returns the buffer address (free it with [NativeBuffer.free]) and fills
   * [outInfo] with {width, height, rowBytes}. Returns 0 when the bitmap isn't RGBA_1010102 so the
   * caller can fall back to a Skia copy.
   */
  @JvmStatic
  external fun convert1010102(bitmap: Bitmap, outInfo: IntArray): Long

  /**
   * Like [convert1010102], but decodes the JPEG XL image of [length] bytes at [address], stopped by
   * [cancel], downscaled to cover [targetWidth] x [targetHeight] unless either is 0 and to fit
   * within [maxPixelSize].
   */
  @JvmStatic
  external fun decodeJxl(
    address: Long,
    length: Int,
    targetWidth: Int,
    targetHeight: Int,
    maxPixelSize: Int,
    cancelled: ByteBuffer,
    outInfo: IntArray
  ): Long

  /** Stops the [decodeJxl] given this one-byte direct buffer. */
  @JvmStatic
  external fun cancel(cancelled: ByteBuffer)
}
