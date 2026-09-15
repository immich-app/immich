import Foundation

enum NativeCore {
  private static let library = dlopen("@rpath/immich_core_ffi.framework/immich_core_ffi", RTLD_NOW)
  private static let queue = DispatchQueue(label: "app.alextran.immich.core")

  private static func symbol<T>(_ name: String, as type: T.Type) -> T? {
    guard let library, let symbol = dlsym(library, name) else { return nil }
    return unsafeBitCast(symbol, to: type)
  }

  private static let coreLog = symbol("immich_core_log", as: ImmichCoreLogFn.self)
  private static let coreThumbhash = symbol("immich_core_thumbhash", as: ImmichCoreThumbhashFn.self)

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

  static func log(level: ImmichCoreLevel, logger: String, message: String) {
    NSLog("%@: %@", logger, message)
    let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].path
    queue.async {
      guard let coreLog else { return }
      dir.withCString { dir in
        logger.withCString { logger in
          message.withCString { message in
            _ = coreLog(dir, numericCast(level.rawValue), logger, message)
          }
        }
      }
    }
  }
}
