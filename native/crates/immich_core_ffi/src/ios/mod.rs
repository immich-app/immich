//! iOS platform integration. Swift needs no binding layer here — it calls the
//! portable C ABI in [`crate::capi`] directly (via the cbindgen header and the
//! app's `NativeCore.swift` loader), which is why this module is small next to
//! [`crate::android`]: Kotlin's VM needs JNI shims, Swift does not. What lives
//! here is the code that must talk *to* the platform, like the unified-log sink.

mod log;

pub(crate) use log::log_error;
