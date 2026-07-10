import Foundation

// Loads the shared Rust core (immich_core_ffi) — the Swift counterpart of
// Kotlin's `System.loadLibrary`. Flutter's native-assets build embeds the
// framework in the bundle without linking Runner against it, so symbols are
// resolved at runtime. Signatures mirror native/crates/immich_core_ffi/include/immich_core.h.
enum NativeCore {
  typealias ThumbhashDims = @convention(c) (
    UnsafePointer<UInt8>?, UInt, UnsafeMutablePointer<UInt32>?, UnsafeMutablePointer<UInt32>?
  ) -> Bool
  typealias ThumbhashToRgba = @convention(c) (
    UnsafePointer<UInt8>?, UInt, UnsafeMutablePointer<UInt8>?, UInt
  ) -> Bool

  static let thumbhashDims: ThumbhashDims? = symbol("immich_core_thumbhash_dims")
  static let thumbhashToRgba: ThumbhashToRgba? = symbol("immich_core_thumbhash_to_rgba")

  private static let handle: UnsafeMutableRawPointer? = {
    if let frameworks = Bundle.main.privateFrameworksPath {
      let path = "\(frameworks)/immich_core_ffi.framework/immich_core_ffi"
      if let handle = dlopen(path, RTLD_NOW) {
        return handle
      }
    }
    // Fall back to the process scope (dart or a test host already loaded it).
    return dlopen(nil, RTLD_NOW)
  }()

  private static func symbol<T>(_ name: String) -> T? {
    guard let handle, let sym = dlsym(handle, name) else { return nil }
    return unsafeBitCast(sym, to: T.self)
  }
}
