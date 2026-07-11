//! `NativeImage` — the pixel exports Kotlin calls: the bitmap ops ported from the
//! former native_image.c (lock the bitmap, run the shared `immich_core::image`
//! math into a fresh libc buffer, hand it back) and the thumbhash decode.

use std::panic::{catch_unwind, AssertUnwindSafe};

use jni::objects::{JByteArray, JClass, JIntArray, JObject};
use jni::sys::{jint, jlong};
use jni::{Env, EnvUnowned, Outcome};

use super::jnigraphics::{
    AndroidBitmapInfo, AndroidBitmap_getInfo, AndroidBitmap_lockPixels, AndroidBitmap_unlockPixels,
    ANDROID_BITMAP_FORMAT_RGBA_1010102, ANDROID_BITMAP_FORMAT_RGBA_8888,
    ANDROID_BITMAP_RESULT_SUCCESS,
};

/// Locks the bitmap, runs `work` on its pixels into a fresh libc buffer of
/// `dst_len`, and hands the buffer to Kotlin via `out_info` {width, height, rowBytes}.
/// Returns 0 on any failure so the caller takes its existing Skia fallback.
fn with_bitmap_into_buffer(
    env: &mut Env,
    bitmap: &JObject,
    out_info: &JIntArray,
    expected_format: i32,
    out_dims: impl FnOnce(&AndroidBitmapInfo) -> (i32, i32),
    work: impl FnOnce(&AndroidBitmapInfo, &[u8], &mut [u8]) -> bool,
) -> jlong {
    let raw_env = env.get_raw();
    let raw_bitmap = bitmap.as_raw();

    let mut info = AndroidBitmapInfo {
        width: 0,
        height: 0,
        stride: 0,
        format: 0,
        flags: 0,
    };
    // SAFETY: raw_env/raw_bitmap come from live JNI arguments of this call.
    if unsafe { AndroidBitmap_getInfo(raw_env, raw_bitmap, &mut info) }
        != ANDROID_BITMAP_RESULT_SUCCESS
        || info.format != expected_format
    {
        return 0;
    }

    let (dw, dh) = out_dims(&info);
    let dst_len = info.width as usize * info.height as usize * 4;
    // SAFETY: libc heap — this exact address is later freed via NativeBuffer.free
    // (Kotlin) or malloc.free (Dart).
    let dst = unsafe { libc::malloc(dst_len) } as *mut u8;
    if dst.is_null() {
        return 0;
    }

    let mut src_pixels: *mut core::ffi::c_void = std::ptr::null_mut();
    // SAFETY: lock/unlock pair on every path below; the pixels stay valid between.
    if unsafe { AndroidBitmap_lockPixels(raw_env, raw_bitmap, &mut src_pixels) }
        != ANDROID_BITMAP_RESULT_SUCCESS
        || src_pixels.is_null()
    {
        // SAFETY: dst was just malloc'd above and never escaped.
        unsafe { libc::free(dst as *mut libc::c_void) };
        return 0;
    }

    let src_len = info.stride as usize * info.height as usize;
    // AssertUnwindSafe: catching here keeps the unlock + free below on the panic
    // path — otherwise an unwind would leak dst and leave the bitmap locked.
    let ok = catch_unwind(AssertUnwindSafe(|| {
        // SAFETY: the locked bitmap is valid for `stride * height` bytes.
        let src = unsafe { std::slice::from_raw_parts(src_pixels as *const u8, src_len) };
        // SAFETY: dst was allocated with dst_len bytes above and never escaped.
        let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
        work(&info, src, dst_slice)
    }))
    .unwrap_or(false);
    // SAFETY: paired with the successful lock above.
    unsafe { AndroidBitmap_unlockPixels(raw_env, raw_bitmap) };
    if !ok {
        // SAFETY: dst never escaped; free before reporting failure.
        unsafe { libc::free(dst as *mut libc::c_void) };
        return 0;
    }

    let dims = [dw, dh, dw * 4];
    if out_info.set_region(env, 0, &dims).is_err() || env.exception_check() {
        // Keep ownership here if Kotlin can never receive the address.
        // SAFETY: dst never escaped.
        unsafe { libc::free(dst as *mut libc::c_void) };
        return 0;
    }
    dst as jlong
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeImage_rotate<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    bitmap: JObject<'local>,
    orientation: jint,
    out_info: JIntArray<'local>,
) -> jlong {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jlong> {
            Ok(with_bitmap_into_buffer(
                env,
                &bitmap,
                &out_info,
                ANDROID_BITMAP_FORMAT_RGBA_8888,
                |info| {
                    if immich_core::image::swaps_dims(orientation) {
                        (info.height as i32, info.width as i32)
                    } else {
                        (info.width as i32, info.height as i32)
                    }
                },
                |info, src, dst| {
                    immich_core::image::rotate_rgba8888(
                        src,
                        info.stride as usize,
                        info.width as usize,
                        info.height as usize,
                        orientation,
                        dst,
                    )
                },
            ))
        })
        .into_outcome();
    match outcome {
        Outcome::Ok(ptr) => ptr,
        Outcome::Err(e) => {
            super::log_error(&format!("bitmap op failed: {e}"));
            0
        }
        Outcome::Panic(_) => 0,
    }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeImage_convert1010102<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    bitmap: JObject<'local>,
    out_info: JIntArray<'local>,
) -> jlong {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jlong> {
            Ok(with_bitmap_into_buffer(
                env,
                &bitmap,
                &out_info,
                ANDROID_BITMAP_FORMAT_RGBA_1010102,
                |info| (info.width as i32, info.height as i32),
                |info, src, dst| {
                    immich_core::image::rgba1010102_to_rgba8888(
                        src,
                        info.stride as usize,
                        info.width as usize,
                        info.height as usize,
                        dst,
                    )
                },
            ))
        })
        .into_outcome();
    match outcome {
        Outcome::Ok(ptr) => ptr,
        Outcome::Err(e) => {
            super::log_error(&format!("bitmap op failed: {e}"));
            0
        }
        Outcome::Panic(_) => 0,
    }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeImage_thumbhash<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    hash: JByteArray<'local>,
    out_info: JIntArray<'local>,
) -> jlong {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jlong> {
            let hash = env.convert_byte_array(&hash)?;
            let Some((dst, w, h)) = crate::capi::thumbhash::decode_malloc(&hash) else {
                return Ok(0);
            };
            let dims = [w as i32, h as i32, w as i32 * 4];
            if out_info.set_region(env, 0, &dims).is_err() {
                // SAFETY: dst never escaped; free before reporting failure.
                unsafe { libc::free(dst as *mut libc::c_void) };
                return Ok(0);
            }
            Ok(dst as jlong)
        })
        .into_outcome();
    match outcome {
        Outcome::Ok(ptr) => ptr,
        Outcome::Err(e) => {
            super::log_error(&format!("thumbhash decode failed: {e}"));
            0
        }
        Outcome::Panic(_) => 0,
    }
}
