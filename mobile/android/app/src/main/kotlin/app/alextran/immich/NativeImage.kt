package app.alextran.immich

import android.graphics.Bitmap

object NativeImage {
  init {
    System.loadLibrary("immich_core_ffi")
  }

  /**
   * Rotates an RGBA_8888 [bitmap] and returns a malloc'd buffer, or 0 on failure.
   * [outInfo] receives width, height, and row bytes.
   */
  @JvmStatic
  external fun rotate(bitmap: Bitmap, orientation: Int, outInfo: IntArray): Long

  /**
   * Converts an RGBA_1010102 [bitmap] to RGBA_8888 and returns a malloc'd buffer, or 0 on failure.
   * [outInfo] receives width, height, and row bytes.
   */
  @JvmStatic
  external fun convert1010102(bitmap: Bitmap, outInfo: IntArray): Long

  /**
   * Decodes a ThumbHash into a malloc'd RGBA_8888 buffer, or 0 on failure.
   * [outInfo] receives width, height, and row bytes.
   */
  @JvmStatic
  external fun thumbhash(hash: ByteArray, outInfo: IntArray): Long
}
