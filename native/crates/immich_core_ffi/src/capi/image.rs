/// Runs a pixel operation on caller-owned buffers. Invalid input or a failed operation returns false; discard `dst`.
///
/// # Safety
/// `src` and `dst` must be valid for their lengths, initialized, and must not overlap.
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
    // SAFETY: guaranteed by the caller.
    let src_slice = unsafe { std::slice::from_raw_parts(src, src_len) };
    // SAFETY: guaranteed by the caller.
    let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| op(src_slice, dst_slice)))
        .unwrap_or(false)
}

/// Returns whether an EXIF orientation swaps width and height.
#[no_mangle]
pub extern "C" fn immich_core_orientation_swaps_dims(orientation: i32) -> bool {
    super::guard(false, || immich_core::image::swaps_dims(orientation))
}

/// Rotates RGBA8888 buffers. Invalid input or a failed operation returns false; discard `dst`.
///
/// # Safety
/// `src` and `dst` must be valid for their lengths, initialized, and must not overlap.
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
    // SAFETY: guaranteed by this function's caller.
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

/// Converts RGBA_1010102 to RGBA8888. Invalid input or a failed operation returns false; discard `dst`.
///
/// # Safety
/// `src` and `dst` must be valid for their lengths, initialized, and must not overlap.
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
    // SAFETY: guaranteed by this function's caller.
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
