use std::ffi::CString;

const ANDROID_LOG_ERROR: i32 = 6;

#[link(name = "log")]
extern "C" {
    fn __android_log_write(prio: i32, tag: *const libc::c_char, text: *const libc::c_char) -> i32;
}

pub(crate) fn log_error(msg: &str) {
    let Ok(text) = CString::new(msg.replace('\0', " ")) else {
        return;
    };
    // SAFETY: both pointers are live NUL-terminated strings for the call's duration.
    unsafe { __android_log_write(ANDROID_LOG_ERROR, c"immich_core".as_ptr(), text.as_ptr()) };
}
