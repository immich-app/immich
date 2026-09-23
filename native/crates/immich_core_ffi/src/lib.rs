use std::ffi::{CString, c_char};
use std::panic::{self, UnwindSafe};
use std::ptr;

/// Returns the core version as a C string. Free it with `immich_core_free_string`.
#[unsafe(no_mangle)]
pub extern "C" fn immich_core_version() -> *mut c_char {
    guard(ptr::null_mut(), || {
        match CString::new(immich_core::core_version()) {
            Ok(s) => s.into_raw(),
            Err(_) => ptr::null_mut(),
        }
    })
}

/// Releases a string returned by this library. Null is a no-op.
///
/// # Safety
/// `ptr` must come from this library and must not be freed twice.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn immich_core_free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    guard((), || {
        // SAFETY: the caller guarantees `ptr` came from `CString::into_raw` in this library.
        drop(unsafe { CString::from_raw(ptr) });
    });
}

fn guard<T>(fallback: T, f: impl FnOnce() -> T + UnwindSafe) -> T {
    panic::catch_unwind(f).unwrap_or(fallback)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CStr;

    #[test]
    fn version_roundtrips() {
        let p = immich_core_version();
        assert!(!p.is_null());
        // SAFETY: `p` is a C string from this library.
        let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap();
        assert_eq!(s, immich_core::core_version());
        // SAFETY: `p` is freed exactly once.
        unsafe { immich_core_free_string(p) };
    }

    #[test]
    fn free_null_is_noop() {
        // SAFETY: null is allowed by the contract.
        unsafe { immich_core_free_string(ptr::null_mut()) };
    }
}
