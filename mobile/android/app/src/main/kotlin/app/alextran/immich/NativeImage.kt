package app.alextran.immich

import android.graphics.Bitmap

object NativeImage {
  init {
    // rotate() is compiled into the native_buffer shared lib (which already links jnigraphics).
    System.loadLibrary("native_buffer")
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
}
