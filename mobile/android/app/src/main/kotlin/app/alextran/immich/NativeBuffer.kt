package app.alextran.immich

import java.nio.ByteBuffer

const val INITIAL_BUFFER_SIZE = 32 * 1024

object NativeBuffer {
  init {
    System.loadLibrary("immich_core_ffi")
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
  external fun createGlobalRef(obj: Any): Long
}

class NativeByteBuffer(initialCapacity: Int) {
  var pointer = NativeBuffer.allocate(initialCapacity)
  var capacity = initialCapacity
  var offset = 0

  inline fun ensureHeadroom() {
    if (offset == capacity) {
      check(capacity <= Int.MAX_VALUE / 2) { "Native buffer capacity overflow" }
      val newCapacity = capacity * 2
      val newPointer = NativeBuffer.realloc(pointer, newCapacity)
      check(newPointer != 0L) { "Native buffer realloc failed" }
      pointer = newPointer
      capacity = newCapacity
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
