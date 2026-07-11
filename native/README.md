# immich_native_core

Shared Rust core for the pixel work the platforms can't do without native code,
built from source into the app via Flutter native assets. It replaces the android
C layer (`native_buffer.c`/`native_image.c`) and the per-platform thumbhash ports
(`ThumbHash.java`/`Thumbhash.swift`), so the same logic exists once, tested:
- **EXIF-orientation rotate** — from `native_image.c` (#29337; fixes #24796,
  sideways RAW photos). Byte-for-byte the same affine + tiled copy, plus bounds
  checks the raw C can't have.
- **RGBA_1010102 → RGBA8888 convert** — the 10-bit HEIC/AVIF color fix (#29631,
  fixes #24906). Same `round(v*255/1023)` LUT + packing as the C, proven on-device
  against Skia's `Bitmap.copy(ARGB_8888)`.
- **ThumbHash decode** — one bounds-checked implementation instead of the two
  platform ports, which disagreed on rounding and crashed on truncated hashes.
  Both platforms now render identical placeholders.

The image ops fill a caller-owned output buffer (no allocation at the boundary)
because the production callers hold JNI-locked bitmaps; the thumbhash decode
returns a libc allocation the consumer frees with plain `free`.

## Layout
```
crates/
  immich_core        pure logic, no binding deps. capabilities = cargo features
                     (image, thumbhash).
  immich_core_ffi    the hand-written C ABI + cbindgen header — consumed by dart
                     (ffigen), swift (C interop) and kotlin (JNI shims in src/android/)
  immich_core_napi   cdylib (.node) via napi-rs (server, unwired)
immich_native_core/  the Flutter package mobile depends on. build hook + ffigen @Native bindings.
smoke/               host dart + node roundtrip scripts (no device)
```
Bindings are separate crates (Cargo can't gate `crate-type` by feature).

## How the native lib is built (Flutter native assets — no prebuilt, no CI)
`immich_native_core/hook/build.dart` (`native_toolchain_rust`) compiles
`crates/immich_core_ffi` **from source on every app build** via rustup and bundles
it as a Flutter *code asset*. The Dart side uses ffigen `@Native` externals bound to
that asset — no `DynamicLibrary`, no prebuilt artifacts, no fetch/publish/separate-repo.

Native assets is on by default on Flutter stable (3.38+), so a stock `flutter build`
runs the hook. Each builder needs **rustup** (the hook auto-installs the pinned
toolchain + targets from `crates/immich_core_ffi/rust-toolchain.toml`).

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
2. expose a C entry in `crates/immich_core_ffi/src/capi/` — `#[no_mangle] pub extern "C"`,
   wrap the body in `guard(...)`/`catch_unwind` (panic at the boundary → sentinel, never
   unwind into the host), validate pointers, and either fill a caller-owned buffer or
   return Rust-owned memory freed via `immich_core_free_string`.
3. `mise run codegen` — regenerates the committed cbindgen header + ffigen `@Native` bindings.
4. `mise run test:flutter` (host) + a case in `immich_native_core/test/` and in
   `mobile/integration_test/native_core_test.dart` (device). The dart surface is the
   generated bindings; add a hand-written dart wrapper only when a dart feature consumes it.
5. platform callers: kotlin via the existing JNI shim pattern (`NativeImage.kt`), swift
   reads the same header natively.

## Consume from immich/mobile
`immich_native_core: { path: ../native/immich_native_core }` in `mobile/pubspec.yaml`,
then `dart pub get`. No app-level Gradle/Podfile edits — the hook builds + bundles the
lib. Builders need rustup. See the package README for the iOS App-Extension caveat.

`/native/` is codeowned by @santoshakil + @mertalev. License: reuses the immich
repo-root AGPL-3.0 (no separate license file).
