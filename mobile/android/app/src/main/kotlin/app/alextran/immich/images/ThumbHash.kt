package app.alextran.immich.images

object ThumbHash {
  init {
    System.loadLibrary("immich_core_ffi")
  }

  @JvmStatic
  external fun decode(hash: ByteArray, info: IntArray): Long
}
