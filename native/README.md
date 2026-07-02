# immich_native_core (PoC)

Shared Rust core consumed by the **mobile** app (Flutter, dart:ffi) and the
**server** (Node, napi `.node` addon).

Status: **plumbing PoC.** It proves the wiring — Rust → codegen → build-from-source
on each app build → load on both platforms — not a perf win yet. The one capability
(`sha1_hex`) is single-shot in-memory, and the local-sync probe found hashing isn't
the hot path; a measured payload is the next step. `core_version` is a smoke
entrypoint. Mobile is the consumed path; the server napi crate builds and
round-trips but is not wired into the server yet.

## Layout
```
crates/
  immich_core        pure logic, no binding deps. capabilities = cargo features (hashing).
  immich_core_dart   cdylib/staticlib + cbindgen header for dart:ffi (mobile)
  immich_core_napi   cdylib (.node) via napi-rs (server, unwired)
immich_native_core/  the Flutter package mobile depends on. build hook + ffigen @Native bindings.
smoke/               host dart + node roundtrip scripts (no device)
```
Bindings are separate crates (Cargo can't gate `crate-type` by feature).

## How the native lib is built (Flutter native assets — no prebuilt, no CI)
`immich_native_core/hook/build.dart` (`native_toolchain_rust`) compiles
`crates/immich_core_dart` **from source on every app build** via rustup and bundles
it as a Flutter *code asset*. The Dart side uses ffigen `@Native` externals bound to
that asset — no `DynamicLibrary`, no prebuilt artifacts, no fetch/publish/separate-repo.

Native assets is on by default on Flutter stable (3.38+), so a stock `flutter build`
runs the hook. Each builder needs **rustup** (the hook auto-installs the pinned
toolchain + targets from `crates/immich_core_dart/rust-toolchain.toml`).

## Dev commands (mise)
```
mise run build         cargo build --workspace
mise run test          cargo test --workspace     (host Rust tests, incl. FFI-boundary)
mise run lint          clippy -D warnings         (fmt: mise run fmt)
mise run codegen       regen cbindgen header + ffigen @Native bindings — commit the result
mise run test:flutter  HOST FFI roundtrip through the real build hook (no device)
mise run smoke         Rust tests + host dart:ffi + host napi roundtrips
```

## Add a capability (end to end)
1. add the logic to `crates/immich_core` (behind a cargo feature if it pulls a dep).
2. expose a C entry in `crates/immich_core_dart/src/lib.rs` — `#[no_mangle] pub extern "C"`,
   wrap the body in `guard(...)` (panic at the boundary → null, never unwind into the host),
   validate pointers, return Rust-owned memory the caller frees via `immich_core_free_string`.
3. `mise run codegen` — regenerates the committed cbindgen header + ffigen `@Native` bindings.
4. add an ergonomic wrapper + null-check in `immich_native_core/lib/immich_native_core.dart`.
5. (optional) mirror it in `crates/immich_core_napi/src/lib.rs` for the server.
6. `mise run test:flutter` (host) + add a case to `immich_native_core/test/`, and to
   `mobile/integration_test/native_core_test.dart` to exercise it on a device.

## Consume from immich/mobile
`immich_native_core: { path: ../native/immich_native_core }` in `mobile/pubspec.yaml`,
then `dart pub get`. No app-level Gradle/Podfile edits — the hook builds + bundles the
lib. Builders need rustup. See the package README for the iOS App-Extension caveat.

`/native/` is codeowned by @santoshakil + @mertalev. License: reuses the immich
repo-root AGPL-3.0 (no separate license file).
