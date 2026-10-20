use std::sync::atomic::{AtomicBool, Ordering};
use std::{ptr, slice};

use libc::size_t;

#[cfg(target_os = "android")]
use jni::{
    EnvUnowned,
    errors::ThrowRuntimeExAndDefault,
    objects::{JByteBuffer, JClass, JIntArray},
    sys::{jint, jlong},
};
use native_core::jxl::{Image, Jxl, Samples, Target};

use super::guard;

/// The size and colour space of decoded pixels.
#[repr(C)]
#[derive(Default)]
pub struct NativeCoreImageInfo {
    pub width: i32,
    pub height: i32,
    /// 8 or 16, for samples in native byte order.
    pub bit_depth: u8,
    /// ITU-T H.273 colour primaries.
    pub primaries: u8,
    /// ITU-T H.273 transfer characteristics.
    pub transfer: u8,
}

/// Decodes a JPEG XL image to premultiplied RGBA in sRGB, or with `keep_space`, in the image's own
/// space when it has BT.709, BT.2020 or Display P3 primaries with the sRGB, PQ or HLG transfer.
/// `info` gets the size and space. The caller frees the returned buffer with free(). Returns null on
/// failure, or once `native_core_cancel` was called on `cancelled`.
///
/// # Safety
/// `data` must be null or readable for `len` bytes, at most `isize::MAX`.
/// `cancelled` must be null or valid for the call and only changed through `native_core_cancel`.
/// `info` must be null or a valid writable pointer, outside `data`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn native_core_jxl_decode(
    data: *const u8,
    len: size_t,
    keep_space: bool,
    cancelled: *mut bool,
    info: *mut NativeCoreImageInfo,
) -> *mut u8 {
    guard(ptr::null_mut(), || {
        if data.is_null() || cancelled.is_null() || info.is_null() {
            return ptr::null_mut();
        }
        // SAFETY: the caller keeps the flag alive for the call and only changes it atomically.
        let cancelled = unsafe { AtomicBool::from_ptr(cancelled) };
        // SAFETY: the caller provides a buffer readable for len bytes.
        let input = unsafe { slice::from_raw_parts(data, len) };
        let target = if keep_space {
            Target::Source
        } else {
            Target::Srgb
        };
        let Some(Image { cicp, samples }) =
            Jxl::open(input, target).and_then(|image| image.decode(cancelled))
        else {
            return ptr::null_mut();
        };
        let (width, height, bit_depth, pixels) = match samples {
            Samples::U8(rgba) => (rgba.width(), rgba.height(), 8, rgba.into_raw()),
            Samples::U16(rgba) => (rgba.width(), rgba.height(), 16, rgba.into_raw()),
        };
        // SAFETY: the output is writable.
        unsafe {
            *info = NativeCoreImageInfo {
                width: width as i32,
                height: height as i32,
                bit_depth,
                primaries: cicp.primaries as u8,
                transfer: cicp.transfer as u8,
            };
        }
        pixels
    })
}

/// Asks the decode given `flag` to stop early.
///
/// # Safety
/// `flag` must be null or valid and otherwise only read by `native_core_jxl_decode`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn native_core_cancel(flag: *mut bool) {
    if !flag.is_null() {
        // SAFETY: the caller guarantees the flag is valid and only accessed atomically.
        unsafe { AtomicBool::from_ptr(flag) }.store(true, Ordering::Relaxed);
    }
}

#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_decodeJxl<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    data: jlong,
    length: jint,
    cancelled: JByteBuffer<'caller>,
    info: JIntArray<'caller>,
) -> jlong {
    env.with_env(|env| -> jni::errors::Result<jlong> {
        let flag = env.get_direct_buffer_address(&cancelled)?.cast::<bool>();
        let mut decoded = NativeCoreImageInfo::default();
        // SAFETY: Kotlin passes a live native buffer of `length` bytes and a direct buffer it only
        // changes through `cancel`, and the output is valid.
        let rgba = unsafe {
            native_core_jxl_decode(
                data as *const u8,
                length as size_t,
                false,
                flag,
                &mut decoded,
            )
        };
        if !rgba.is_null()
            && let Err(err) =
                info.set_region(env, 0, &[decoded.width, decoded.height, decoded.width * 4])
        {
            // SAFETY: this malloc buffer has not been transferred to Kotlin.
            unsafe { libc::free(rgba.cast()) };
            return Err(err);
        }
        Ok(rgba as jlong)
    })
    .resolve::<ThrowRuntimeExAndDefault>()
}

#[cfg(target_os = "android")]
#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_cancel<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    flag: JByteBuffer<'caller>,
) {
    env.with_env(|env| -> jni::errors::Result<()> {
        let flag = env.get_direct_buffer_address(&flag)?.cast::<bool>();
        // SAFETY: the buffer is the live one-byte flag Kotlin passed to `decodeJxl`.
        unsafe { native_core_cancel(flag) };
        Ok(())
    })
    .resolve::<ThrowRuntimeExAndDefault>();
}
