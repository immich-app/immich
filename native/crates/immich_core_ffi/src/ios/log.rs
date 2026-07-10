//! Unified-log sink — NSLog through hand-declared Foundation/CoreFoundation
//! externs (stable C ABI, no crate deps; same pattern as the android jnigraphics
//! declarations). Errors show up in Xcode's console and Console.app.

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
    // SAFETY: the format literal and message are live NUL-terminated strings; the
    // "%@" format takes exactly one object argument, so no format injection from
    // the message is possible. Both CFStrings are released after the call.
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
