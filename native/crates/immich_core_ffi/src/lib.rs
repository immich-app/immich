//! Mobile FFI bindings for `immich_core`.
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

pub use capi::image::{
    immich_core_orientation_swaps_dims, immich_core_rgba1010102_to_rgba8888,
    immich_core_rotate_rgba8888,
};
pub use capi::thumbhash::immich_core_thumbhash_decode;
pub use capi::{immich_core_free, immich_core_free_string, immich_core_version};
