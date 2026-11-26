# Native core

Rust code that ships inside the mobile app and the server. Flutter compiles it from source through the
`native_core` build hook, so building the app needs a Rust toolchain: `mise install`
in `mobile/` sets one up, otherwise install [rustup](https://rustup.rs) once and the build
fetches the pinned toolchain itself. The server loads it as a Node addon, which
`mise run node:build` builds for the host; the server's Docker image, dev container and CI build their own.

- `crates/codecs`: the image decoders, a feature each, behind one `decode`
- `crates/native_core`: the shared logic, a feature per part and a group per target
- `crates/native_core_ffi`: the C ABI on the `flutter` group, cbindgen writes `include/native_core.h`
- `crates/native_core_node`: the Node addon on the `server` group, built with napi-rs into `dist/` as `@immich/native-core`
- `native_core`: Flutter package with the build hook and the ffigen bindings
  (`NOTICES` carries the licenses of the crates compiled into the core, update it with the dependencies)

`mise run build`, `test`, `lint`, and `fmt`. The header and the Dart bindings come from `mise run //mobile:codegen:native`.
