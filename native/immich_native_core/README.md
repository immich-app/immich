# immich_native_core (Flutter package)

Build hook and Dart FFI bindings for the Immich native core.

The hook builds `immich_core_ffi` from source and bundles it as a Flutter code
asset. Builders need `rustup`; the Rust version and targets are pinned in the
FFI crate's `rust-toolchain.toml`.

Workspace commands are in [`../README.md`](../README.md).
