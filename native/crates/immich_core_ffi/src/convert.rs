// Each 10-bit channel rounds v*255/1023 (16.16 fixed point) and alpha maps to a*85. Plain arithmetic
// on purpose: the loop auto-vectorizes and beat a lookup table on-device.
/// # Safety
/// `src` must point to `h` rows of `stride` bytes, each starting with `w` aligned RGBA_1010102 pixels.
/// `dst` must hold `w * h` pixels and not overlap `src`.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
unsafe fn convert(src: *const u8, stride: usize, dst: *mut u32, w: usize, h: usize) {
    for y in 0..h {
        // SAFETY: the caller supplies h aligned source rows of stride bytes and w*h output pixels.
        unsafe {
            let row = src.add(y * stride).cast::<u32>();
            for x in 0..w {
                let px = row.add(x).read();
                let r = ((px & 0x3ff) * 16336 + 32768) >> 16;
                let g = (((px >> 10) & 0x3ff) * 16336 + 32768) >> 16;
                let b = (((px >> 20) & 0x3ff) * 16336 + 32768) >> 16;
                let a = (px >> 30) * 85;
                dst.add(y * w + x)
                    .write(r | (g << 8) | (b << 16) | (a << 24));
            }
        }
    }
}

#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_convert1010102<'caller>(
    mut env: jni::EnvUnowned<'caller>,
    _class: jni::objects::JClass<'caller>,
    bitmap: jni::objects::JObject<'caller>,
    out_info: jni::objects::JIntArray<'caller>,
) -> jni::sys::jlong {
    use super::bitmap::{self, RESULT_SUCCESS};
    use std::ptr;
    const FORMAT_RGBA_1010102: i32 = 10;

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
        if info.format != FORMAT_RGBA_1010102 {
            return Ok(0);
        }
        let w = info.width as usize;
        let h = info.height as usize;
        // SAFETY: malloc accepts the byte size of this valid Android bitmap.
        dst = unsafe { libc::malloc(w * h * 4) };
        if dst.is_null() {
            return Ok(0);
        }
        let mut src = ptr::null_mut();
        // SAFETY: the bitmap reference is valid and src is writable.
        if unsafe { bitmap::lock_pixels(raw_env, bitmap.as_raw(), &mut src) } != RESULT_SUCCESS {
            return Ok(0);
        }
        // SAFETY: the locked bitmap holds h aligned rows of stride bytes; dst holds w*h pixels.
        unsafe { convert(src.cast(), info.stride as usize, dst.cast(), w, h) };
        // SAFETY: the successful lock is balanced before returning the buffer.
        unsafe { bitmap::unlock_pixels(raw_env, bitmap.as_raw()) };
        out_info.set_region(env, 0, &[w as i32, h as i32, (w * 4) as i32])?;
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
    use super::convert;

    #[test]
    fn channels_and_alpha() {
        for (a, byte) in [(0, 0), (1, 85), (2, 170), (3, 255)] {
            let src: [u32; 3] = [
                (0x0ff << 10) | (0x3ff << 20) | (a << 30),
                0x0ff | (0x3ff << 10) | (a << 30),
                0x3ff | (0x0ff << 20) | (a << 30),
            ];
            let mut dst = [0; 3];
            // SAFETY: src and dst each contain three aligned u32 pixels.
            unsafe { convert(src.as_ptr().cast(), 12, dst.as_mut_ptr(), 3, 1) };
            assert_eq!(
                dst,
                [
                    0xff4000 | (byte << 24),
                    0x00ff40 | (byte << 24),
                    0x4000ff | (byte << 24)
                ]
            );
        }
    }

    #[test]
    fn padded_rows() {
        let src: [u32; 6] = [
            0xc00003ff, 0xc00ffc00, 0xdeadbeef, 0xfff00000, 0xffffffff, 0xdeadbeef,
        ];
        let mut dst = [0; 4];
        // SAFETY: src holds two padded rows of two pixels; dst holds four pixels.
        unsafe { convert(src.as_ptr().cast(), 12, dst.as_mut_ptr(), 2, 2) };
        assert_eq!(dst, [0xff0000ff, 0xff00ff00, 0xffff0000, 0xffffffff]);
    }
}
