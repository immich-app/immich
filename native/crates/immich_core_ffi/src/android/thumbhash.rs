//! `ThumbHash` — decodes a placeholder hash into a fresh libc RGBA buffer, same
//! ownership contract as the `NativeImage` ops (freed via NativeBuffer.free from
//! Kotlin or malloc.free from Dart). Returns 0 on a malformed hash.

use jni::objects::{JByteArray, JClass, JIntArray};
use jni::sys::jlong;
use jni::{EnvUnowned, Outcome};

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_images_ThumbHash_nativeDecode<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    hash: JByteArray<'local>,
    out_info: JIntArray<'local>,
) -> jlong {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jlong> {
            let hash = env.convert_byte_array(&hash)?;
            let Some((w, h)) = immich_core::thumbhash::dims(&hash) else {
                return Ok(0);
            };
            let dst_len = w as usize * h as usize * 4;
            // SAFETY: libc heap — this exact address is later freed via
            // NativeBuffer.free (Kotlin) or malloc.free (Dart).
            let dst = unsafe { libc::malloc(dst_len) } as *mut u8;
            if dst.is_null() {
                return Ok(0);
            }
            // SAFETY: dst was allocated with dst_len bytes above and never escaped.
            let dst_slice = unsafe { std::slice::from_raw_parts_mut(dst, dst_len) };
            let dims = [w as i32, h as i32, w as i32 * 4];
            if !immich_core::thumbhash::to_rgba(&hash, dst_slice)
                || out_info.set_region(env, 0, &dims).is_err()
            {
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
