//! dart:ffi binding for immich_core (mobile).
//!
//! Returns heap-allocated C strings the caller must release with
//! `immich_core_free_string`. cbindgen emits `include/immich_core.h` at build time.
#![deny(clippy::unwrap_used, clippy::expect_used)]

use std::ffi::{c_char, CString};
use std::ptr;

/// Native core version as a NUL-terminated UTF-8 string.
/// Free the result with [`immich_core_free_string`].
#[no_mangle]
pub extern "C" fn immich_core_version() -> *mut c_char {
    guard(ptr::null_mut(), || {
        into_c_string(immich_core::core_version().to_owned())
    })
}

/// Rotate an RGBA8888 image to the given EXIF `orientation`. `src` is `sh` rows of
/// `src_stride` bytes; `dst` is the caller's densely-packed `dw*dh*4` output (dims
/// swap for 90/270/transpose). Returns false (a safe no-op) on null pointers or
/// inconsistent sizes so the caller can fall back. The platform side owns the
/// bitmap lock + the dst allocation; this only fills dst.
///
/// # Safety
/// `src` must be valid for reads of `src_len` bytes and `dst` for writes of `dst_len`.
#[no_mangle]
pub unsafe extern "C" fn immich_core_rotate_rgba8888(
    src: *const u8,
    src_len: usize,
    src_stride: usize,
    width: u32,
    height: u32,
    orientation: i32,
    dst: *mut u8,
    dst_len: usize,
) -> bool {
    if src.is_null() || dst.is_null() {
        return false;
    }
    // SAFETY: caller guarantees `src` is valid for reads of `src_len` bytes (see # Safety).
    let src_slice = unsafe { std::slice::from_raw_parts(src, src_len) };
    // SAFETY: caller guarantees `dst` is valid for writes of `dst_len` bytes (see # Safety).
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
    // AssertUnwindSafe: the closure writes through `&mut dst_slice`, which isn't
    // UnwindSafe, but a panic mid-rotate only leaves dst partially written — not a
    // broken invariant — and we return false so the caller discards the buffer.
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        immich_core::image::rotate_rgba8888(
            src_slice,
            src_stride,
            width as usize,
            height as usize,
            orientation,
            dst_slice,
        )
    }))
    .unwrap_or(false)
}

/// Convert an RGBA_1010102 image (`src`, `sh` rows of `src_stride` bytes) to
/// RGBA8888 in the caller's densely-packed `w*h*4` `dst`, matching Skia's
/// `Bitmap.copy(ARGB_8888)`. Returns false (a safe no-op) on null pointers or
/// inconsistent sizes so the caller can fall back. The platform side owns the
/// bitmap lock + the dst allocation; this only fills dst.
///
/// # Safety
/// `src` must be valid for reads of `src_len` bytes and `dst` for writes of `dst_len`.
#[no_mangle]
pub unsafe extern "C" fn immich_core_rgba1010102_to_rgba8888(
    src: *const u8,
    src_len: usize,
    src_stride: usize,
    width: u32,
    height: u32,
    dst: *mut u8,
    dst_len: usize,
) -> bool {
    if src.is_null() || dst.is_null() {
        return false;
    }
    // SAFETY: caller guarantees `src` is valid for reads of `src_len` bytes (see # Safety).
    let src_slice = unsafe { std::slice::from_raw_parts(src, src_len) };
    // SAFETY: caller guarantees `dst` is valid for writes of `dst_len` bytes (see # Safety).
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
    // AssertUnwindSafe: a panic mid-convert only leaves dst partially written — not a
    // broken invariant — and we return false so the caller discards the buffer.
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        immich_core::image::rgba1010102_to_rgba8888(
            src_slice,
            src_stride,
            width as usize,
            height as usize,
            dst_slice,
        )
    }))
    .unwrap_or(false)
}

/// Release a string returned by this library.
///
/// # Safety
/// `ptr` must be a pointer previously returned by this library, or null.
#[no_mangle]
pub unsafe extern "C" fn immich_core_free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    guard((), || {
        // SAFETY: `ptr` came from this library's `CString::into_raw` (see # Safety).
        let s = unsafe { CString::from_raw(ptr) };
        drop(s);
    });
}

/// Run `f` at the FFI boundary, turning a panic into `sentinel` rather than
/// unwinding across `extern "C"` into the host. Guards panics only — a bad `len`
/// or a double/foreign free is caller-contract UB that stays the caller's
/// `# Safety` obligation, not something this can catch.
fn guard<T>(sentinel: T, f: impl FnOnce() -> T + std::panic::UnwindSafe) -> T {
    std::panic::catch_unwind(f).unwrap_or(sentinel)
}

fn into_c_string(s: String) -> *mut c_char {
    match CString::new(s) {
        Ok(c) => c.into_raw(),
        Err(_) => ptr::null_mut(),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]
    use super::*;
    use std::ffi::CStr;

    #[test]
    fn version_roundtrips_and_frees() {
        let p = immich_core_version();
        assert!(!p.is_null());
        // SAFETY: `p` is a non-null NUL-terminated string from this library.
        let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap();
        assert!(!s.is_empty());
        // SAFETY: `p` was returned by this library and is freed exactly once.
        unsafe { immich_core_free_string(p) };
    }

    #[test]
    fn free_null_is_noop() {
        // SAFETY: free_string explicitly accepts null.
        unsafe { immich_core_free_string(ptr::null_mut()) };
    }
}
