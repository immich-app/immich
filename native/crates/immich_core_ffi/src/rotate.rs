#[cfg_attr(not(target_os = "android"), allow(dead_code))]
fn dimensions(w: i64, h: i64, orientation: i32) -> (i64, i64) {
    if (5..=8).contains(&orientation) {
        (h, w)
    } else {
        (w, h)
    }
}

/// # Safety
/// `src` must point to `h` rows of `stride` bytes, each starting with `w` aligned `u32` pixels.
/// `dst` must hold `w * h` pixels and not overlap `src`.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
unsafe fn rotate(src: *const u8, stride: usize, dst: *mut u32, w: i64, h: i64, orientation: i32) {
    let (dw, _) = dimensions(w, h, orientation);
    // A source pixel (x, y) lands at base + x * step_x + y * step_y in the dense dw-wide output,
    // the same layout as Bitmap.createBitmap(src, matrixForExifOrientation(orientation)).
    let (base, step_x, step_y) = match orientation {
        2 => (w - 1, -1, dw),
        3 => ((h - 1) * dw + w - 1, -1, -dw),
        4 => ((h - 1) * dw, 1, -dw),
        5 => (0, dw, 1),
        6 => (h - 1, dw, -1),
        7 => ((w - 1) * dw + h - 1, -dw, -1),
        8 => ((w - 1) * dw, -dw, 1),
        _ => (0, 1, dw),
    };
    // 32x32 u32 tiles are 4KB, so the scattered writes of a 90/270 transpose stay in L1.
    for ty in (0..h).step_by(32) {
        for tx in (0..w).step_by(32) {
            for y in ty..(ty + 32).min(h) {
                // SAFETY: the caller supplies h source rows of stride bytes.
                let row = unsafe { src.add(y as usize * stride).cast::<u32>() };
                let mut idx = base + y * step_y + tx * step_x;
                for x in tx..(tx + 32).min(w) {
                    // SAFETY: the affine mapping stays within the w*h output and x stays within its row.
                    unsafe {
                        dst.add(idx as usize).write(row.add(x as usize).read());
                    }
                    idx += step_x;
                }
            }
        }
    }
}

#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_rotate<'caller>(
    mut env: jni::EnvUnowned<'caller>,
    _class: jni::objects::JClass<'caller>,
    bitmap: jni::objects::JObject<'caller>,
    orientation: jni::sys::jint,
    out_info: jni::objects::JIntArray<'caller>,
) -> jni::sys::jlong {
    use super::bitmap::{self, RESULT_SUCCESS};
    use std::ptr;
    const FORMAT_RGBA_8888: i32 = 1;

    let mut dst = ptr::null_mut();
    let outcome = env.with_env(|env| -> jni::errors::Result<_> {
        let raw_env = env.get_raw();
        let mut info = std::mem::MaybeUninit::uninit();
        // SAFETY: JNI owns the bitmap reference and info is writable.
        if unsafe { bitmap::get_info(raw_env, bitmap.as_raw(), info.as_mut_ptr()) }
            != RESULT_SUCCESS
        {
            return Ok(0);
        }
        // SAFETY: get_info initialized info on success.
        let info = unsafe { info.assume_init() };
        if info.format != FORMAT_RGBA_8888 {
            return Ok(0);
        }
        let (w, h) = (i64::from(info.width), i64::from(info.height));
        let stride = info.stride as usize;
        let (dw, dh) = dimensions(w, h, orientation);
        // SAFETY: malloc accepts the byte size of this valid Android bitmap.
        dst = unsafe { libc::malloc(dw as usize * dh as usize * 4) };
        if dst.is_null() {
            return Ok(0);
        }
        let mut src = ptr::null_mut();
        // SAFETY: the bitmap reference is valid and src is writable.
        if unsafe { bitmap::lock_pixels(raw_env, bitmap.as_raw(), &mut src) } != RESULT_SUCCESS {
            return Ok(0);
        }
        // SAFETY: the locked RGBA bitmap supplies the source rows; malloc holds dw*dh pixels.
        unsafe { rotate(src.cast(), stride, dst.cast(), w, h, orientation) };
        // SAFETY: balances the successful lock above.
        unsafe { bitmap::unlock_pixels(raw_env, bitmap.as_raw()) };
        out_info.set_region(env, 0, &[dw as i32, dh as i32, (dw * 4) as i32])?;
        Ok(dst as jni::sys::jlong)
    });
    let result = outcome.resolve::<jni::errors::ThrowRuntimeExAndDefault>();
    if result == 0 {
        // SAFETY: dst is null or the malloc allocation that has not been returned to Kotlin.
        unsafe { libc::free(dst) };
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exif_orientations() {
        let src = [1u32, 2, 3, 4, 5, 6];
        let cases = [
            (1, (3, 2), [1, 2, 3, 4, 5, 6]),
            (2, (3, 2), [3, 2, 1, 6, 5, 4]),
            (3, (3, 2), [6, 5, 4, 3, 2, 1]),
            (4, (3, 2), [4, 5, 6, 1, 2, 3]),
            (5, (2, 3), [1, 4, 2, 5, 3, 6]),
            (6, (2, 3), [4, 1, 5, 2, 6, 3]),
            (7, (2, 3), [6, 3, 5, 2, 4, 1]),
            (8, (2, 3), [3, 6, 2, 5, 1, 4]),
            (9, (3, 2), [1, 2, 3, 4, 5, 6]),
        ];
        for (orientation, size, expected) in cases {
            let mut dst = [0; 6];
            // SAFETY: both arrays hold the six pixels required by the 3x2 image.
            unsafe { rotate(src.as_ptr().cast(), 12, dst.as_mut_ptr(), 3, 2, orientation) };
            assert_eq!(dimensions(3, 2, orientation), size);
            assert_eq!(dst, expected, "orientation {orientation}");
        }
    }

    #[test]
    fn padded_rows() {
        let src = [1u32, 2, 3, 99, 4, 5, 6, 99];
        let mut dst = [0; 6];
        // SAFETY: the source has two padded rows; the destination holds six pixels.
        unsafe { rotate(src.as_ptr().cast(), 16, dst.as_mut_ptr(), 3, 2, 6) };
        assert_eq!(dst, [4, 1, 5, 2, 6, 3]);
    }
}
