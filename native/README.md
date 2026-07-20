# Native core

Shared Rust code used by the Immich mobile app. Flutter builds it from source
through the `immich_native_core` native-assets hook.

## Layout
```
crates/
  immich_core        shared image and thumbhash code
  immich_core_ffi    C ABI and Android JNI exports
  immich_core_napi   Node binding
immich_native_core/  Flutter package and build hook
smoke/               host Dart and Node checks
```

## Commands

Building the mobile app requires `rustup`. The toolchain and targets are pinned
in `crates/immich_core_ffi/rust-toolchain.toml`.

```
mise run build
mise run test
mise run lint
mise run fmt
mise run codegen
mise run test:flutter
mise run smoke
```
