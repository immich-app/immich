package app.alextran.immich

import java.nio.ByteBuffer

const val INITIAL_BUFFER_SIZE = 32 * 1024

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

  @JvmStatic
  external fun createGlobalRef(obj: Any): Long
}

class NativeByteBuffer(initialCapacity: Int) {
  var pointer = NativeBuffer.allocate(initialCapacity)
  var capacity = initialCapacity
  var offset = 0

  inline fun ensureHeadroom() {
    if (offset == capacity) {
      capacity *= 2
      pointer = NativeBuffer.realloc(pointer, capacity)
    }
  }

  inline fun wrapRemaining() = NativeBuffer.wrap(pointer + offset, capacity - offset)

  inline fun advance(bytesRead: Int) {
    offset += bytesRead
  }

  inline fun free() {
    if (pointer != 0L) {
      NativeBuffer.free(pointer)
      pointer = 0L
    }
  }
}
