//! The portable C ABI — the `extern "C"` surface cbindgen turns into
//! `include/immich_core.h`, consumed by Dart (`@Native`) and Swift (the header).
//! [`image`] holds the pixel ops; this file holds the version/string lifecycle and
//! the shared panic guard.

pub mod image;
pub mod thumbhash;

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
    crate::log::ensure_panic_hook();
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
