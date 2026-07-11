//! C-ABI thumbhash decode. One call: parse, malloc, fill. Every consumer (dart,
//! swift, and kotlin via the JNI wrapper) wants an allocated RGBA buffer, so
//! unlike the image ops there is no caller-owned dst here — the buffer comes back
//! on the libc heap and the caller releases it with plain `free` (dart:
//! `malloc.free`, kotlin: `NativeBuffer.free`).

use std::panic::{catch_unwind, AssertUnwindSafe};

/// Decodes `hash` into a fresh libc allocation. Shared by the C export below and
/// the android JNI wrapper. Returns the buffer with its (width, height), or None
/// on a malformed hash — never leaking the allocation on any failure path.
pub(crate) fn decode_malloc(hash: &[u8]) -> Option<(*mut u8, u32, u32)> {
    let (w, h) = immich_core::thumbhash::dims(hash)?;
    let len = w as usize * h as usize * 4;
    // SAFETY: libc heap — this exact address is later freed by the consumer via
    // free()/malloc.free/NativeBuffer.free.
    let dst = unsafe { libc::malloc(len) } as *mut u8;
    if dst.is_null() {
        return None;
    }
    // SAFETY: dst was allocated with len bytes above and never escaped.
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, len) };
    // AssertUnwindSafe: a panic mid-fill only leaves dst partially written, and
    // dst is freed right here on that path.
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

/// Decode a ThumbHash into a freshly malloc'd RGBA8888 buffer (not premultiplied
/// by alpha) and fill `out_info` with {width, height, rowBytes}. The caller owns
/// the buffer and releases it with `free`. Returns null on a malformed hash,
/// leaving `out_info` untouched.
///
/// # Safety
/// `hash` must be valid for reads of `hash_len` bytes and `out_info` for writes
/// of three u32 values.
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
    // SAFETY: caller guarantees `hash` is valid for reads of `hash_len` bytes (see # Safety).
    let hash_slice = unsafe { std::slice::from_raw_parts(hash, hash_len) };
    match catch_unwind(|| decode_malloc(hash_slice)) {
        Ok(Some((dst, w, h))) => {
            // SAFETY: caller guarantees `out_info` is valid for three u32 writes (see # Safety).
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
