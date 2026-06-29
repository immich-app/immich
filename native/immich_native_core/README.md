# immich_native_core (Flutter package)

dart:ffi bindings to the `immich_native_core` Rust core. The native code is **built
from source on every app build** via a Dart build hook (Flutter native assets) — no
prebuilt binaries, no `DynamicLibrary`, no platform plugin glue.

## Use it from immich/mobile

```yaml
# mobile/pubspec.yaml
dependencies:
  immich_native_core:
    path: ../native/immich_native_core
```

`dart pub get`, then call it:

```dart
import 'package:immich_native_core/immich_native_core.dart';

final version = coreVersion();
final hex = sha1Hex(bytes); // hash large inputs off the main isolate (worker_manager)
```

No app-level Gradle/Podfile edits. `hook/build.dart` compiles the Rust crate and
Flutter bundles it as a code asset; the `@Native` bindings resolve against it.
**Requirement:** every machine that builds the app needs [rustup](https://rustup.rs)
— the hook auto-installs the pinned toolchain + targets from the crate's
`rust-toolchain.toml`.

## Layout

- `hook/build.dart` — builds `../crates/immich_core_dart` via `native_toolchain_rust`.
- `lib/immich_native_core.dart` — barrel, the public API.
- `lib/src/{core,hashing,image}.dart` — thin wrappers, one file per Rust module.
- `lib/src/ffi/bindings.g.dart` — ffigen `@Native` output (committed; do not edit).
- `ffigen.yaml` — ffi-native mode; asset-id must match the hook's `assetName`.
- `test/` — host FFI roundtrip (`flutter test`); device runs via `mobile/integration_test`.

## ⚠ iOS App Extensions

Code assets are bundled into the app's **Runner** target. immich ships a Share
Extension and a Widget Extension — if the core is ever called from one of those,
verify the symbols resolve there (same family as the embed-into-Runner-only gotcha).
Not an issue while only the main app calls it.

The Rust workspace, the codegen/build/test commands, and the "add a function" loop
live in [`../README.md`](../README.md).
