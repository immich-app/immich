use std::{ptr, slice};

use libc::size_t;

use immich_core::thumbhash;

use super::guard;

/// Decodes a thumbhash to RGBA. The caller frees the returned buffer with free().
/// Returns null on failure.
///
/// # Safety
/// `hash` must be null or readable for `len` bytes, at most `isize::MAX`.
/// `width` and `height` must be null or valid writable pointers, outside `hash`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn immich_core_thumbhash(
    hash: *const u8,
    len: size_t,
    width: *mut i32,
    height: *mut i32,
) -> *mut u8 {
    guard(ptr::null_mut(), || {
        if hash.is_null() || width.is_null() || height.is_null() {
            return ptr::null_mut();
        }
        // SAFETY: the caller provides a buffer readable for len bytes.
        let hash = unsafe { slice::from_raw_parts(hash, len) };
        let Some((w, h, pixels)) = thumbhash::decode(hash) else {
            return ptr::null_mut();
        };
        let size = (w * h * 4) as usize;
        // SAFETY: malloc accepts any size.
        let rgba = unsafe { libc::malloc(size).cast::<u8>() };
        if rgba.is_null() {
            return rgba;
        }
        // SAFETY: malloc returned size writable bytes, disjoint from pixels; outputs are writable.
        unsafe {
            ptr::copy_nonoverlapping(pixels.as_ptr(), rgba, size);
            *width = w as i32;
            *height = h as i32;
        }
        rgba
    })
}
