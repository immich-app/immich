# native/AGENTS.md

Rust code compiled into the mobile app and the server. `crates/codecs` holds the image decoders (one feature each), `crates/native_core` the shared logic, `crates/native_core_ffi` the C ABI whose header cbindgen writes to `include/native_core.h`, and `crates/native_core_node` the server's Node addon (napi-rs, package `@immich/native-core`). `native_core/` is the Flutter package with the build hook that compiles the crates from source and the ffigen bindings.

## Rules

- Every `unsafe` block needs a `// SAFETY:` comment; clippy denies `undocumented_unsafe_blocks` and `mise //native:lint` runs with `-D warnings`.
- The release profile keeps unwinding because the FFI boundary relies on `catch_unwind`; do not set `panic = "abort"`.
- When a crate dependency changes, update `native_core/NOTICES` with its license.

## Skills

- **Build, test and lint**: `mise //native:build`, `mise //native:test`, `mise //native:lint`, `mise //native:fmt`. The toolchain is pinned in `crates/native_core_ffi/rust-toolchain.toml` and `mise.toml`; keep them in sync.
- **Change the Node surface**: edit `crates/native_core_node`, then run `mise //native:node:build` to rebuild the addon and regenerate its loader and types in `dist/` (gitignored). `mise //server:build` and the server CI tasks build it first.
- **Change the FFI surface**: edit `crates/native_core_ffi`, then run `mise //mobile:codegen:native` to rebuild the C header and regenerate the Dart bindings in `native_core/lib/src/bindings.g.dart`. The Flutter build recompiles the crates on the next `flutter run`.
