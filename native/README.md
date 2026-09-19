# Native core

Rust code that ships inside the mobile app. Flutter compiles it from source through the
`immich_native_core` build hook, so building the app needs a Rust toolchain: `mise install`
in `mobile/` sets one up, otherwise install [rustup](https://rustup.rs) once and the build
fetches the pinned toolchain itself.

- `crates/immich_core`: the shared logic
- `crates/immich_db`: the app's sqlite databases, schema generated from the Flutter side
- `crates/immich_core_ffi`: the C ABI, cbindgen writes `include/immich_core.h`
- `immich_native_core`: Flutter package with the build hook and the ffigen bindings
  (`NOTICES` carries the licenses of the crates compiled into the core, update it with the dependencies)

`mise run build`, `test`, `lint`, `fmt`, and `codegen` (regenerates the header and the Dart bindings).
