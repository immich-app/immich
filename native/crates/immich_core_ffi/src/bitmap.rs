use std::ffi::c_void;

use jni::sys::{JNIEnv, jobject};

pub const RESULT_SUCCESS: i32 = 0;

#[repr(C)]
pub struct Info {
    pub width: u32,
    pub height: u32,
    pub stride: u32,
    pub format: i32,
    pub flags: u32,
}

#[link(name = "jnigraphics")]
unsafe extern "C" {
    #[link_name = "AndroidBitmap_getInfo"]
    pub fn get_info(env: *mut JNIEnv, bitmap: jobject, info: *mut Info) -> i32;
    #[link_name = "AndroidBitmap_lockPixels"]
    pub fn lock_pixels(env: *mut JNIEnv, bitmap: jobject, pixels: *mut *mut c_void) -> i32;
    #[link_name = "AndroidBitmap_unlockPixels"]
    pub fn unlock_pixels(env: *mut JNIEnv, bitmap: jobject) -> i32;
}
