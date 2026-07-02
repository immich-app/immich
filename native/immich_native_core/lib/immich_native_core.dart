/// dart:ffi bindings to the immich_native_core Rust core (built from source via
/// Dart build hooks). Public API only — implementation lives in `src/`, organised
/// to mirror the Rust crate's modules (core / hashing / image).
library;

export 'src/core.dart';
export 'src/hashing.dart';
export 'src/image.dart';
