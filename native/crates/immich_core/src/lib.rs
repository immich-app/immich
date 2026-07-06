//! immich_native_core — shared Rust core for the immich server (napi) and mobile (dart:ffi).
//!
//! Pure logic only: no binding or platform deps live here. Each binding crate
//! (`immich_core_ffi`, `immich_core_napi`) is a thin wrapper. Capabilities are
//! cargo features (`image`, ...) so every binding opts into the same set.

#[cfg(feature = "image")]
pub mod image;

/// Version of the native core. Smoke-test entrypoint exercised by every binding.
pub fn core_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_is_present() {
        assert!(!core_version().is_empty());
    }
}
