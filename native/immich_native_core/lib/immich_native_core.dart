/// dart:ffi bindings to the immich_native_core Rust core, built from source and
/// bundled via the Dart build hook. The dart surface is exactly the ffigen output
/// of the C header — the production callers of the current capabilities are the
/// platform decode pipelines (Kotlin/JNI, Swift), so there are no hand-written
/// dart wrappers; add one only when a dart feature actually consumes a function.
library;

export 'src/ffi/bindings.g.dart';
