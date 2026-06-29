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

/// SHA-1 (lowercase hex) of a buffer. JS: `core.sha1Hex(Buffer.from(...))`.
#[napi]
pub fn sha1_hex(bytes: napi::bindgen_prelude::Buffer) -> String {
    immich_core::hashing::sha1_hex(bytes.as_ref())
}

/// SHA-1 (lowercase hex) of a file, read via mmap. JS: `core.sha1File(path)`.
#[napi]
pub fn sha1_file(path: String) -> napi::Result<String> {
    immich_core::hashing::sha1_file(&path).map_err(|e| napi::Error::from_reason(e.to_string()))
}
