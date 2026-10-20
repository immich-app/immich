use std::ffi::c_void;
use std::mem::MaybeUninit;
use std::{ptr, slice};

use jni::EnvUnowned;
use jni::errors::ThrowRuntimeExAndDefault;
use jni::objects::{JIntArray, JObject};
use jni::sys::{JNIEnv, jlong, jobject};

pub const FORMAT_RGBA_8888: i32 = 1;
pub const FORMAT_RGBA_1010102: i32 = 10;

const RESULT_SUCCESS: i32 = 0;

#[repr(C)]
struct Info {
    width: u32,
    height: u32,
    stride: u32,
    format: i32,
    flags: u32,
}

#[link(name = "jnigraphics")]
unsafe extern "C" {
    #[link_name = "AndroidBitmap_getInfo"]
    fn get_info(env: *mut JNIEnv, bitmap: jobject, info: *mut Info) -> i32;
    #[link_name = "AndroidBitmap_lockPixels"]
    fn lock_pixels(env: *mut JNIEnv, bitmap: jobject, pixels: *mut *mut c_void) -> i32;
    #[link_name = "AndroidBitmap_unlockPixels"]
    fn unlock_pixels(env: *mut JNIEnv, bitmap: jobject) -> i32;
}

/// Runs `f(src, stride, width, height, dst)` over the pixels of a `format` bitmap, writing into a
/// malloc'd dense buffer of `size(width, height)` pixels that Kotlin frees. Fills `out_info` with
/// {width, height, rowBytes} of that buffer. Returns 0 when the bitmap can't be handled.
pub fn transform<'caller>(
    mut env: EnvUnowned<'caller>,
    bitmap: JObject<'caller>,
    out_info: JIntArray<'caller>,
    format: i32,
    size: impl Fn(usize, usize) -> (usize, usize),
    f: impl FnOnce(&[u32], usize, usize, usize, &mut [u32]),
) -> jlong {
    let mut dst = ptr::null_mut();
    let outcome = env.with_env(|env| -> jni::errors::Result<_> {
        let raw_env = env.get_raw();
        let mut info = MaybeUninit::uninit();
        // SAFETY: JNI owns the bitmap reference and info is writable.
        if unsafe { get_info(raw_env, bitmap.as_raw(), info.as_mut_ptr()) } != RESULT_SUCCESS {
            return Ok(0);
        }
        // SAFETY: get_info initialized info on success.
        let info = unsafe { info.assume_init() };
        if info.format != format {
            return Ok(0);
        }
        let (w, h) = (info.width as usize, info.height as usize);
        let stride = info.stride as usize / 4;
        let (dw, dh) = size(w, h);
        // SAFETY: malloc accepts the byte size of this valid Android bitmap.
        dst = unsafe { libc::malloc(dw * dh * 4) };
        if dst.is_null() {
            return Ok(0);
        }
        let mut pixels = ptr::null_mut();
        // SAFETY: the bitmap reference is valid and pixels is writable.
        if unsafe { lock_pixels(raw_env, bitmap.as_raw(), &mut pixels) } != RESULT_SUCCESS {
            return Ok(0);
        }
        // SAFETY: a locked 4 byte format bitmap holds h aligned rows of stride pixels, and the
        // malloc above holds dw * dh pixels.
        let (src, out) = unsafe {
            (
                slice::from_raw_parts(pixels.cast::<u32>(), h * stride),
                slice::from_raw_parts_mut(dst.cast::<u32>(), dw * dh),
            )
        };
        f(src, stride, w, h, out);
        // SAFETY: balances the successful lock above.
        unsafe { unlock_pixels(raw_env, bitmap.as_raw()) };
        out_info.set_region(env, 0, &[dw as i32, dh as i32, (dw * 4) as i32])?;
        Ok(dst as jlong)
    });
    let result = outcome.resolve::<ThrowRuntimeExAndDefault>();
    if result == 0 {
        // SAFETY: dst is null or the malloc allocation that has not been returned to Kotlin.
        unsafe { libc::free(dst) };
    }
    result
}
