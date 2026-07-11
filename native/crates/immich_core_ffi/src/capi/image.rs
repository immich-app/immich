//! C-ABI image ops. The platform side owns the bitmap lock + the `dst` allocation
//! and calls these to fill `dst` from `src`; both are caller-owned buffers.

/// Shared boundary for the caller-owned-`dst` pixel ops: null-check both pointers,
/// view them as slices, and run `op` under catch_unwind — a panic mid-write only
/// leaves `dst` partially filled, and the `false` return tells the caller to
/// discard it. Nothing outside `src_len`/`dst_len` is touched.
///
/// # Safety
/// `src` must be valid for reads of `src_len` bytes, `dst` for writes of `dst_len`,
/// and the two ranges must not overlap.
pub(super) unsafe fn fill_dst(
    src: *const u8,
    src_len: usize,
    dst: *mut u8,
    dst_len: usize,
    op: impl FnOnce(&[u8], &mut [u8]) -> bool,
) -> bool {
    crate::log::ensure_panic_hook();
    if src.is_null() || dst.is_null() {
        return false;
    }
    // SAFETY: caller guarantees `src` is valid for reads of `src_len` bytes (see # Safety).
    let src_slice = unsafe { std::slice::from_raw_parts(src, src_len) };
    // SAFETY: caller guarantees `dst` is valid for writes of `dst_len` bytes (see # Safety).
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
    // AssertUnwindSafe: the closure writes through `&mut dst_slice`, which isn't
    // UnwindSafe, but a partial write is discarded on the `false` path.
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| op(src_slice, dst_slice)))
        .unwrap_or(false)
}

/// Whether the EXIF `orientation` swaps width and height (the 90/270/transpose
/// family) — callers use it to size and report the rotated output dims.
#[no_mangle]
pub extern "C" fn immich_core_orientation_swaps_dims(orientation: i32) -> bool {
    super::guard(false, || immich_core::image::swaps_dims(orientation))
}

/// Rotate an RGBA8888 image to the given EXIF `orientation`. `src` is `sh` rows of
/// `src_stride` bytes; `dst` is the caller's densely-packed `dw*dh*4` output (dims
/// swap for 90/270/transpose). Returns false (a safe no-op) on null pointers or
/// inconsistent sizes so the caller can fall back. The platform side owns the
/// bitmap lock + the dst allocation; this only fills dst.
///
/// # Safety
/// `src` must be valid for reads of `src_len` bytes, `dst` for writes of `dst_len`,
/// and the two ranges must not overlap.
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
    // SAFETY: pointers/lengths forwarded verbatim to fill_dst (see # Safety).
    unsafe {
        fill_dst(src, src_len, dst, dst_len, |s, d| {
            immich_core::image::rotate_rgba8888(
                s,
                src_stride,
                width as usize,
                height as usize,
                orientation,
                d,
            )
        })
    }
}

/// Convert an RGBA_1010102 image (`src`, `sh` rows of `src_stride` bytes) to
/// RGBA8888 in the caller's densely-packed `w*h*4` `dst`, matching Skia's
/// `Bitmap.copy(ARGB_8888)`. Returns false (a safe no-op) on null pointers or
/// inconsistent sizes so the caller can fall back. The platform side owns the
/// bitmap lock + the dst allocation; this only fills dst.
///
/// # Safety
/// `src` must be valid for reads of `src_len` bytes, `dst` for writes of `dst_len`,
/// and the two ranges must not overlap.
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
    // SAFETY: pointers/lengths forwarded verbatim to fill_dst (see # Safety).
    unsafe {
        fill_dst(src, src_len, dst, dst_len, |s, d| {
            immich_core::image::rgba1010102_to_rgba8888(
                s,
                src_stride,
                width as usize,
                height as usize,
                d,
            )
        })
    }
}
