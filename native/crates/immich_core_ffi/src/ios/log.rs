use std::ffi::{c_char, c_void, CString};

const K_CF_STRING_ENCODING_UTF8: u32 = 0x0800_0100;

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFStringCreateWithCString(
        alloc: *const c_void,
        c_str: *const c_char,
        encoding: u32,
    ) -> *const c_void;
    fn CFRelease(cf: *const c_void);
}

#[link(name = "Foundation", kind = "framework")]
extern "C" {
    fn NSLog(format: *const c_void, ...);
}

pub(crate) fn log_error(msg: &str) {
    let Ok(text) = CString::new(format!("immich_core: {}", msg.replace('\0', " "))) else {
        return;
    };
    // SAFETY: both CFStrings stay live through NSLog and are released below.
    unsafe {
        let format =
            CFStringCreateWithCString(std::ptr::null(), c"%@".as_ptr(), K_CF_STRING_ENCODING_UTF8);
        let message =
            CFStringCreateWithCString(std::ptr::null(), text.as_ptr(), K_CF_STRING_ENCODING_UTF8);
        if !format.is_null() && !message.is_null() {
            NSLog(format, message);
        }
        if !message.is_null() {
            CFRelease(message);
        }
        if !format.is_null() {
            CFRelease(format);
        }
    }
}
