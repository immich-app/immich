import 'dart:ffi';

import 'package:ffi/ffi.dart';

import 'bindings.g.dart' as bindings;

/// Read a C string the core returned into a Dart string and free it. A null
/// return means the native call failed (panic caught at the boundary, or error),
/// so we throw rather than hand back a silent empty value.
String readAndFree(Pointer<Char> ptr, String op) {
  if (ptr == nullptr) {
    throw StateError('immich_native_core: $op returned null');
  }
  try {
    return ptr.cast<Utf8>().toDartString();
  } finally {
    bindings.immich_core_free_string(ptr);
  }
}
