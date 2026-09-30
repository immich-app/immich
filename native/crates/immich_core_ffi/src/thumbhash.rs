use std::{ptr, slice};

use libc::size_t;

use immich_core::thumbhash;
#[cfg(target_os = "android")]
use jni::{
    EnvUnowned,
    errors::ThrowRuntimeExAndDefault,
    objects::{JByteArray, JClass, JIntArray},
    sys::jlong,
};

use super::guard;

/// Decodes a thumbhash to RGBA. The caller frees the returned buffer with free().
/// Returns null on failure.
///
/// # Safety
/// `hash` must be null or readable for `len` bytes, at most `isize::MAX`.
/// `width` and `height` must be null or valid writable pointers, outside `hash`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn immich_core_thumbhash(
    hash: *const u8,
    len: size_t,
    width: *mut i32,
    height: *mut i32,
) -> *mut u8 {
    guard(ptr::null_mut(), || {
        if hash.is_null() || width.is_null() || height.is_null() {
            return ptr::null_mut();
        }
        // SAFETY: the caller provides a buffer readable for len bytes.
        let hash = unsafe { slice::from_raw_parts(hash, len) };
        // SAFETY: calloc accepts any size.
        let rgba = unsafe { libc::calloc(1, 32 * 32 * 4).cast::<[u8; 32 * 32 * 4]>() };
        if rgba.is_null() {
            return ptr::null_mut();
        }
        // SAFETY: calloc returned that many zeroed bytes that nothing else references.
        let Some((w, h)) = thumbhash::decode(hash, unsafe { &mut *rgba }) else {
            // SAFETY: the buffer has not been returned to the caller.
            unsafe { libc::free(rgba.cast()) };
            return ptr::null_mut();
        };
        // SAFETY: the outputs are writable.
        unsafe {
            *width = w as i32;
            *height = h as i32;
        }
        rgba.cast()
    })
}

#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_images_ThumbHash_decode<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    hash: JByteArray<'caller>,
    info: JIntArray<'caller>,
) -> jlong {
    env.with_env(|env| -> jni::errors::Result<jlong> {
        let hash = env.convert_byte_array(&hash)?;
        let (mut width, mut height) = (0, 0);
        // SAFETY: the hash bytes and both output pointers are valid for this call.
        let rgba =
            unsafe { immich_core_thumbhash(hash.as_ptr(), hash.len(), &mut width, &mut height) };
        if !rgba.is_null()
            && let Err(err) = info.set_region(env, 0, &[width, height, width * 4])
        {
            // SAFETY: this malloc buffer has not been transferred to Dart.
            unsafe { libc::free(rgba.cast()) };
            return Err(err);
        }
        Ok(rgba as jlong)
    })
    .resolve::<ThrowRuntimeExAndDefault>()
}
