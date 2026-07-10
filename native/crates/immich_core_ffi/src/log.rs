//! Failure visibility. Every FFI boundary converts a panic into a sentinel the
//! caller silently falls back on — right for the caller, but it would bury the
//! failure. [`ensure_panic_hook`] installs a process-wide hook (once) that writes
//! the panic message and location to the platform log first: logcat on Android,
//! the unified log (Console.app) on iOS, stderr elsewhere.

use std::sync::Once;

#[cfg(target_os = "android")]
use crate::android::log_error;
#[cfg(target_os = "ios")]
use crate::ios::log_error;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn log_error(msg: &str) {
    eprintln!("immich_core: {msg}");
}

pub(crate) fn ensure_panic_hook() {
    static HOOK: Once = Once::new();
    HOOK.call_once(|| {
        let previous = std::panic::take_hook();
        std::panic::set_hook(Box::new(move |info| {
            let msg = info
                .payload()
                .downcast_ref::<&str>()
                .copied()
                .or_else(|| info.payload().downcast_ref::<String>().map(String::as_str))
                .unwrap_or("panic");
            let location = info
                .location()
                .map(|l| format!("{}:{}", l.file(), l.line()))
                .unwrap_or_default();
            log_error(&format!("panic at {location}: {msg}"));
            previous(info);
        }));
    });
}
