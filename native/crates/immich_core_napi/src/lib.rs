//! napi-rs binding for immich_core (node server).
//!
//! Built as a cdylib loaded as a `.node` addon — the same shape as the server's
//! existing native deps (sharp, bcrypt).

use napi_derive::napi;

/// Native core version. JS: `core.coreVersion()`.
#[napi]
pub fn core_version() -> String {
    immich_core::core_version().to_owned()
}
