//! dart:ffi binding for immich_core (mobile).
//!
//! Returns heap-allocated C strings the caller must release with
//! `immich_core_free_string`. cbindgen emits `include/immich_core.h` at build time.
#![deny(clippy::unwrap_used, clippy::expect_used)]

use std::ffi::{c_char, CStr, CString};
use std::os::raw::c_uchar;
use std::ptr;

/// Native core version as a NUL-terminated UTF-8 string.
/// Free the result with [`immich_core_free_string`].
#[no_mangle]
pub extern "C" fn immich_core_version() -> *mut c_char {
    guard(ptr::null_mut(), || {
        into_c_string(immich_core::core_version().to_owned())
    })
}

/// SHA-1 (lowercase hex) of `len` bytes at `ptr`. Returns NULL on a null pointer.
/// Free the result with [`immich_core_free_string`].
///
/// # Safety
/// `ptr` must be valid for reads of `len` bytes.
#[no_mangle]
pub unsafe extern "C" fn immich_core_sha1_hex(ptr: *const c_uchar, len: usize) -> *mut c_char {
    if ptr.is_null() {
        return ptr::null_mut();
    }
    // SAFETY: caller guarantees `ptr` is valid for reads of `len` bytes (see # Safety).
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    guard(ptr::null_mut(), || {
        into_c_string(immich_core::hashing::sha1_hex(bytes))
    })
}

/// SHA-1 (lowercase hex) of the file at `path` (NUL-terminated UTF-8), read via
/// mmap — no Dart-side read or copy. Returns NULL on a null path, non-UTF-8 path,
/// or any IO error. Free the result with [`immich_core_free_string`].
///
/// # Safety
/// `path` must be a valid NUL-terminated C string, or null.
#[no_mangle]
pub unsafe extern "C" fn immich_core_sha1_file(path: *const c_char) -> *mut c_char {
    if path.is_null() {
        return ptr::null_mut();
    }
    // SAFETY: caller guarantees `path` is a valid NUL-terminated C string (see # Safety).
    let cpath = unsafe { CStr::from_ptr(path) };
    guard(ptr::null_mut(), || match cpath.to_str() {
        Ok(s) => match immich_core::hashing::sha1_file(s) {
            Ok(hex) => into_c_string(hex),
            Err(_) => ptr::null_mut(),
        },
        Err(_) => ptr::null_mut(),
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
    fn sha1_null_ptr_returns_null() {
        // SAFETY: a null ptr is the documented null-returning case.
        let p = unsafe { immich_core_sha1_hex(ptr::null(), 0) };
        assert!(p.is_null());
    }

    #[test]
    fn sha1_known_vector_roundtrips_and_frees() {
        let input = b"abc";
        // SAFETY: `input` is valid for reads of `input.len()` bytes.
        let p = unsafe { immich_core_sha1_hex(input.as_ptr(), input.len()) };
        assert!(!p.is_null());
        // SAFETY: `p` is a non-null NUL-terminated string from this library.
        let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap();
        assert_eq!(s, "a9993e364706816aba3e25717850c26c9cd0d89d");
        // SAFETY: `p` was returned by this library and is freed exactly once.
        unsafe { immich_core_free_string(p) };
    }

    #[test]
    fn free_null_is_noop() {
        // SAFETY: free_string explicitly accepts null.
        unsafe { immich_core_free_string(ptr::null_mut()) };
    }

    #[test]
    fn sha1_file_roundtrips_and_frees() {
        let path = std::env::temp_dir().join(format!("immich_core_ffi_{}.bin", std::process::id()));
        std::fs::write(&path, b"abc").unwrap();
        let c = std::ffi::CString::new(path.to_str().unwrap()).unwrap();
        // SAFETY: `c` is a valid NUL-terminated path string.
        let p = unsafe { immich_core_sha1_file(c.as_ptr()) };
        assert!(!p.is_null());
        // SAFETY: `p` is a non-null string from this library.
        let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap();
        assert_eq!(s, "a9993e364706816aba3e25717850c26c9cd0d89d");
        // SAFETY: `p` was returned by this library, freed once.
        unsafe { immich_core_free_string(p) };
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn sha1_file_null_returns_null() {
        // SAFETY: a null path is the documented null-returning case.
        let p = unsafe { immich_core_sha1_file(ptr::null()) };
        assert!(p.is_null());
    }
}
