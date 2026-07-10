//! C-ABI thumbhash decode. `dims` first to size the output, then `to_rgba` into
//! the caller's buffer — same caller-owns-dst contract as the image ops.

/// Placeholder size for a ThumbHash. Returns false (leaving the out params
/// untouched) if the hash is malformed.
///
/// # Safety
/// `hash` must be valid for reads of `hash_len` bytes; `out_width`/`out_height`
/// must be valid for writes.
#[no_mangle]
pub unsafe extern "C" fn immich_core_thumbhash_dims(
    hash: *const u8,
    hash_len: usize,
    out_width: *mut u32,
    out_height: *mut u32,
) -> bool {
    crate::log::ensure_panic_hook();
    if hash.is_null() || out_width.is_null() || out_height.is_null() {
        return false;
    }
    // SAFETY: caller guarantees `hash` is valid for reads of `hash_len` bytes (see # Safety).
    let hash_slice = unsafe { std::slice::from_raw_parts(hash, hash_len) };
    let dims = std::panic::catch_unwind(|| immich_core::thumbhash::dims(hash_slice))
        .ok()
        .flatten();
    match dims {
        Some((w, h)) => {
            // SAFETY: caller guarantees the out pointers are valid for writes (see # Safety).
            unsafe {
                *out_width = w;
                *out_height = h;
            }
            true
        }
        None => false,
    }
}

/// Render a ThumbHash as RGBA8888 (not premultiplied) into the caller's
/// densely-packed `w*h*4` `dst`, sized via [`immich_core_thumbhash_dims`].
/// Returns false (a safe no-op) on a malformed hash or short buffer.
///
/// # Safety
/// `hash` must be valid for reads of `hash_len` bytes and `dst` for writes of
/// `dst_len`.
#[no_mangle]
pub unsafe extern "C" fn immich_core_thumbhash_to_rgba(
    hash: *const u8,
    hash_len: usize,
    dst: *mut u8,
    dst_len: usize,
) -> bool {
    // SAFETY: pointers/lengths forwarded verbatim to fill_dst (see # Safety).
    unsafe {
        super::image::fill_dst(hash, hash_len, dst, dst_len, |h, d| {
            immich_core::thumbhash::to_rgba(h, d)
        })
    }
}
