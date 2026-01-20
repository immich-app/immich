package app.alextran.immich

import java.nio.ByteBuffer

/**
 * JNI interface for native memory operations.
 * Used by HTTP responses and image processing to avoid copies.
 */
object NativeBuffer {
  init {
    System.loadLibrary("native_buffer")
  }

  @JvmStatic
  external fun allocate(size: Int): Long

  @JvmStatic
  external fun free(address: Long)

  @JvmStatic
  external fun realloc(address: Long, size: Int): Long

  @JvmStatic
  external fun wrap(address: Long, capacity: Int): ByteBuffer

  @JvmStatic
  external fun copy(buffer: ByteBuffer, destAddress: Long, offset: Int, length: Int)
}
