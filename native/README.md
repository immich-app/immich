# Native core

Rust code that ships inside the mobile app. Flutter compiles it from source through the
`native_core` build hook, so building the app needs a Rust toolchain: `mise install`
in `mobile/` sets one up, otherwise install [rustup](https://rustup.rs) once and the build
fetches the pinned toolchain itself.

- `crates/native_core`: the shared logic
- `crates/native_core_ffi`: the C ABI, cbindgen writes `include/native_core.h`
- `native_core`: Flutter package with the build hook and the ffigen bindings
  (`NOTICES` carries the licenses of the crates compiled into the core, update it with the dependencies)

`mise run build`, `test`, `lint`, and `fmt`. The header and the Dart bindings come from `mise run //mobile:codegen:native`.
