use napi_derive::napi;

#[napi]
pub fn version() -> &'static str {
    native_core::version()
}
