import 'package:ffi/ffi.dart';

import 'src/bindings.g.dart';

String version() {
  final ptr = native_core_version();
  try {
    return ptr.cast<Utf8>().toDartString();
  } finally {
    native_core_free_string(ptr);
  }
}
