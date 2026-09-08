import Foundation

enum NativeCore {
  private static let library = dlopen("@rpath/immich_core_ffi.framework/immich_core_ffi", RTLD_NOW)
  private static let queue = DispatchQueue(label: "app.alextran.immich.core")

  private static func symbol<T>(_ name: String, as type: T.Type) -> T? {
    guard let library, let symbol = dlsym(library, name) else { return nil }
    return unsafeBitCast(symbol, to: type)
  }

  private static let coreLog = symbol("immich_core_log", as: ImmichCoreLogFn.self)

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
