import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';

import 'ffi/bindings.g.dart' as bindings;
import 'ffi/ffi.dart';

/// Lowercase-hex SHA-1 of [bytes]. Reads every byte natively and blocks the
/// calling thread, so hash large inputs off the main isolate.
String sha1Hex(Uint8List bytes) {
  // allocate at least 1 byte — malloc(0) may return null (allocator-defined),
  // which package:ffi would reject. The native side still reads only [len] bytes.
  final len = bytes.length;
  final buf = malloc<Uint8>(len == 0 ? 1 : len);
  try {
    if (len > 0) buf.asTypedList(len).setAll(0, bytes);
    return readAndFree(
      bindings.immich_core_sha1_hex(buf.cast(), len),
      'sha1_hex',
    );
  } finally {
    malloc.free(buf);
  }
}

/// Lowercase-hex SHA-1 of the file at [path], hashed natively via mmap — the file
/// is never read into the Dart heap. Blocks the calling thread, so hash large
/// files off the main isolate. Throws if the file is missing/unreadable.
String sha1File(String path) {
  final cpath = path.toNativeUtf8();
  try {
    return readAndFree(
      bindings.immich_core_sha1_file(cpath.cast()),
      'sha1_file',
    );
  } finally {
    malloc.free(cpath);
  }
}
