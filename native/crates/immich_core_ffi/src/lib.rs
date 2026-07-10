//! FFI wrapper around `immich_core` for the mobile app. One cdylib, two ABI
//! surfaces: [`capi`] is the portable `extern "C"` layer (Dart `@Native` + the
//! Swift header cbindgen emits into `include/immich_core.h`); [`android`] is the
//! JNI layer Kotlin loads via `System.loadLibrary` — [`ios`] stays small because
//! Swift calls [`capi`] directly. [`runtime`] is the shared tokio runtime for
//! async work; [`log`] makes boundary failures visible in logcat / Console.app.
//!
//! C strings returned here are heap-allocated; the caller frees them with
//! `immich_core_free_string`.
#![deny(clippy::unwrap_used, clippy::expect_used)]

mod capi;
mod log;
pub mod runtime;

/// cbindgen:ignore
#[cfg(target_os = "android")]
mod android;

/// cbindgen:ignore
#[cfg(target_os = "ios")]
mod ios;

// Re-export the C-ABI surface at the crate root so Rust consumers (the c_abi
// integration test) reach it as `immich_core_ffi::immich_core_*`; the exported
// symbols themselves are name-based (`#[no_mangle]`), independent of this path.
pub use capi::image::{
    immich_core_orientation_swaps_dims, immich_core_rgba1010102_to_rgba8888,
    immich_core_rotate_rgba8888,
};
pub use capi::thumbhash::{immich_core_thumbhash_dims, immich_core_thumbhash_to_rgba};
pub use capi::{immich_core_free_string, immich_core_version};
