//! Node binding for `immich_core`.

use napi_derive::napi;

#[napi]
pub fn core_version() -> String {
    immich_core::core_version().to_owned()
}
