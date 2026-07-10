import Foundation

// The decode lives in the shared Rust core (immich_core::thumbhash); this is the
// malloc-and-call glue. The buffer is libc-allocated so dart frees the exact
// address with malloc.free. Returns nil on a malformed hash instead of trapping.
func thumbHashToRGBA(hash: Data) -> (Int, Int, UnsafeMutableRawBufferPointer)? {
  guard let dims = NativeCore.thumbhashDims, let toRgba = NativeCore.thumbhashToRgba else {
    return nil
  }

  var w: UInt32 = 0
  var h: UInt32 = 0
  let parsed = hash.withUnsafeBytes { bytes in
    dims(bytes.bindMemory(to: UInt8.self).baseAddress, UInt(bytes.count), &w, &h)
  }
  guard parsed, w > 0, h > 0 else { return nil }

  let byteCount = Int(w) * Int(h) * 4
  guard let raw = malloc(byteCount) else { return nil }
  let filled = hash.withUnsafeBytes { bytes in
    toRgba(
      bytes.bindMemory(to: UInt8.self).baseAddress, UInt(bytes.count),
      raw.assumingMemoryBound(to: UInt8.self), UInt(byteCount)
    )
  }
  guard filled else {
    free(raw)
    return nil
  }
  return (Int(w), Int(h), UnsafeMutableRawBufferPointer(start: raw, count: byteCount))
}
