import Foundation

enum NativeCore {
  private static let library = dlopen("@rpath/native_core_ffi.framework/native_core_ffi", RTLD_NOW)

  private static func symbol<T>(_ name: String, as type: T.Type) -> T? {
    guard let library, let symbol = dlsym(library, name) else { return nil }
    return unsafeBitCast(symbol, to: type)
  }

  private static let coreThumbhash = symbol("native_core_thumbhash", as: NativeCoreThumbhashFn.self)
  private static let coreJxlDecode = symbol("native_core_jxl_decode", as: NativeCoreJxlDecodeFn.self)
  private static let coreCancel = symbol("native_core_cancel", as: NativeCoreCancelFn.self)

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

  static func decodeJxl(_ data: Data, targetWidth: Int64?, targetHeight: Int64?, maxPixelSize: Int, cancelled: UnsafeMutablePointer<Bool>) -> (width: Int, height: Int, pointer: UnsafeMutableRawPointer)? {
    guard let coreJxlDecode else { return nil }
    var info = NativeCoreImageInfo()
    return data.withUnsafeBytes { bytes in
      guard let pointer = coreJxlDecode(bytes.bindMemory(to: UInt8.self).baseAddress, bytes.count, false, UInt32(clamping: targetWidth ?? 0), UInt32(clamping: targetHeight ?? 0), UInt32(clamping: maxPixelSize), cancelled, &info)
      else { return nil }
      return (Int(info.width), Int(info.height), UnsafeMutableRawPointer(pointer))
    }
  }

  static func cancel(_ flag: UnsafeMutablePointer<Bool>) {
    coreCancel?(flag)
  }
}
