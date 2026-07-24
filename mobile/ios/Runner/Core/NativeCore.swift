import Foundation
import OSLog

// Native assets embed the framework without linking Runner, so resolve its symbol at runtime.
enum NativeCore {
  typealias ThumbhashDecode = @convention(c) (
    UnsafePointer<UInt8>?, UInt, UnsafeMutablePointer<UInt32>?
  ) -> UnsafeMutablePointer<UInt8>?

  static let thumbhashDecode: ThumbhashDecode? = symbol("immich_core_thumbhash_decode")
  private static let logger = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "app.alextran.immich",
    category: "NativeCore"
  )

  private static let handle: UnsafeMutableRawPointer? = load()

  private static func load() -> UnsafeMutableRawPointer? {
    if let frameworks = Bundle.main.privateFrameworksPath {
      let path = "\(frameworks)/immich_core_ffi.framework/immich_core_ffi"
      dlerror()
      if let handle = dlopen(path, RTLD_NOW) {
        return handle
      }
      let error = lastError()
      logger.warning("dlopen failed for \(path, privacy: .public): \(error, privacy: .public)")
    }

    dlerror()
    guard let handle = dlopen(nil, RTLD_NOW) else {
      let error = lastError()
      logger.error("dlopen failed for process scope: \(error, privacy: .public)")
      return nil
    }
    return handle
  }

  private static func symbol<T>(_ name: String) -> T? {
    guard let handle else {
      logger.error("native core is unavailable while loading \(name, privacy: .public)")
      return nil
    }

    dlerror()
    guard let sym = dlsym(handle, name) else {
      let error = lastError()
      logger.error("dlsym failed for \(name, privacy: .public): \(error, privacy: .public)")
      return nil
    }
    return unsafeBitCast(sym, to: T.self)
  }

  private static func lastError() -> String {
    guard let error = dlerror() else { return "unknown error" }
    return String(cString: error)
  }
}
