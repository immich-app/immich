use std::panic::{catch_unwind, AssertUnwindSafe};

pub(crate) fn decode_malloc(hash: &[u8]) -> Option<(*mut u8, u32, u32)> {
    let (w, h) = immich_core::thumbhash::dims(hash)?;
    let len = w as usize * h as usize * 4;
    // SAFETY: calloc returns len zeroed bytes; callers free them through the libc heap.
    let dst = unsafe { libc::calloc(len, 1) } as *mut u8;
    if dst.is_null() {
        return None;
    }
    // SAFETY: dst points to len initialized bytes and has not escaped.
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, len) };
    let ok = catch_unwind(AssertUnwindSafe(|| {
        immich_core::thumbhash::to_rgba(hash, dst_slice)
    }))
    .unwrap_or(false);
    if !ok {
        // SAFETY: dst never escaped.
        unsafe { libc::free(dst as *mut libc::c_void) };
        return None;
    }
    Some((dst, w, h))
}

/// Decodes a ThumbHash into a libc buffer and writes width, height, and row bytes to `out_info`.
/// Free the buffer with `free`; malformed hashes return null.
///
/// # Safety
/// `hash` must be valid for `hash_len` bytes and `out_info` for three u32 writes.
#[no_mangle]
pub unsafe extern "C" fn immich_core_thumbhash_decode(
    hash: *const u8,
    hash_len: usize,
    out_info: *mut u32,
) -> *mut u8 {
    crate::log::ensure_panic_hook();
    if hash.is_null() || out_info.is_null() {
        return std::ptr::null_mut();
    }
    // SAFETY: guaranteed by the caller.
    let hash_slice = unsafe { std::slice::from_raw_parts(hash, hash_len) };
    match catch_unwind(|| decode_malloc(hash_slice)) {
        Ok(Some((dst, w, h))) => {
            // SAFETY: guaranteed by the caller.
            unsafe {
                *out_info = w;
                *out_info.add(1) = h;
                *out_info.add(2) = w * 4;
            }
            dst
        }
        _ => std::ptr::null_mut(),
    }
}
