//! The three stable-ABI bitmap calls from libjnigraphics.so (ships in every NDK
//! sysroot). Hand-declared instead of pulling the ndk crate for three functions.

use jni::sys::jobject;

#[repr(C)]
pub(super) struct AndroidBitmapInfo {
    pub width: u32,
    pub height: u32,
    pub stride: u32,
    pub format: i32,
    pub flags: u32,
}

pub(super) const ANDROID_BITMAP_RESULT_SUCCESS: i32 = 0;
pub(super) const ANDROID_BITMAP_FORMAT_RGBA_8888: i32 = 1;
pub(super) const ANDROID_BITMAP_FORMAT_RGBA_1010102: i32 = 10;

#[link(name = "jnigraphics")]
extern "C" {
    pub(super) fn AndroidBitmap_getInfo(
        env: *mut jni::sys::JNIEnv,
        jbitmap: jobject,
        info: *mut AndroidBitmapInfo,
    ) -> i32;
    pub(super) fn AndroidBitmap_lockPixels(
        env: *mut jni::sys::JNIEnv,
        jbitmap: jobject,
        addr_ptr: *mut *mut core::ffi::c_void,
    ) -> i32;
    pub(super) fn AndroidBitmap_unlockPixels(env: *mut jni::sys::JNIEnv, jbitmap: jobject) -> i32;
}
