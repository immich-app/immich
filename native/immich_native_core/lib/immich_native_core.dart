import 'package:ffi/ffi.dart';

import 'src/bindings.g.dart';

String version() {
  final ptr = immich_core_version();
  try {
    return ptr.cast<Utf8>().toDartString();
  } finally {
    immich_core_free_string(ptr);
  }
}
