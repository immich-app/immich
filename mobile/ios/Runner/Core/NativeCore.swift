import Foundation

enum NativeCore {
  private static let library = dlopen("@rpath/native_core_ffi.framework/native_core_ffi", RTLD_NOW)

  private static func symbol<T>(_ name: String, as type: T.Type) -> T? {
    guard let library, let symbol = dlsym(library, name) else { return nil }
    return unsafeBitCast(symbol, to: type)
  }

  private static let coreThumbhash = symbol("native_core_thumbhash", as: NativeCoreThumbhashFn.self)

  static func thumbhash(_ hash: Data) -> (width: Int, height: Int, pointer: UnsafeMutableRawPointer)? {
    guard let coreThumbhash else { return nil }
    var width: Int32 = 0
    var height: Int32 = 0
    return hash.withUnsafeBytes { bytes in
      guard let pointer = coreThumbhash(bytes.bindMemory(to: UInt8.self).baseAddress, bytes.count, &width, &height)
      else { return nil }
      return (Int(width), Int(height), UnsafeMutableRawPointer(pointer))
    }
  }
}
