//! Android JNI exports — the `NativeBuffer` and `NativeImage` Kotlin objects load
//! this library directly (`System.loadLibrary("immich_core_ffi")`), so the whole
//! native layer is this one Rust cdylib. Split by the Kotlin object each group
//! backs: [`buffer`] (NativeBuffer, the libc-heap allocator bridge) and [`image`]
//! (NativeImage, the bitmap pixel ops), with [`jnigraphics`] holding the
//! libjnigraphics declarations the image ops lock bitmaps through.
//!
//! Buffer memory MUST live on the libc heap: Dart frees these exact addresses via
//! `package:ffi` `malloc.free` (process-global libc `free`), and Kotlin grows them
//! with `realloc`. Rust's own allocator is never allowed to touch them.
//!
//! Panics never unwind into the JVM: the env-using methods run their body inside
//! `EnvUnowned::with_env`, which wraps it in `catch_unwind` and maps a panic (or a
//! JNI error) to the sentinel return; the pure allocator methods have no panicking
//! code at all.

mod buffer;
mod image;
mod jnigraphics;
mod log;

pub(crate) use log::log_error;
