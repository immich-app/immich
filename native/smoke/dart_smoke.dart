// Mobile-side roundtrip: open the dart:ffi cdylib and call into the shared core.
// Standalone script (no package:ffi dep) — reads the returned C string by hand.
//
//   dart run smoke/dart_smoke.dart target/debug/libimmich_core_ffi.dylib

import 'dart:ffi';

typedef _VersionNative = Pointer<Uint8> Function();
typedef _FreeNative = Void Function(Pointer<Uint8>);
typedef _FreeDart = void Function(Pointer<Uint8>);

String _readCString(Pointer<Uint8> p) {
  final bytes = <int>[];
  for (var i = 0; p[i] != 0; i++) {
    bytes.add(p[i]);
  }
  return String.fromCharCodes(bytes);
}

void main(List<String> args) {
  final libPath = args.isNotEmpty ? args.first : 'target/debug/libimmich_core_ffi.dylib';
  final lib = DynamicLibrary.open(libPath);

  final version = lib.lookupFunction<_VersionNative, _VersionNative>('immich_core_version');
  final free = lib.lookupFunction<_FreeNative, _FreeDart>('immich_core_free_string');

  final ptr = version();
  print('DART core_version = ${_readCString(ptr)}');
  free(ptr);
  print('DART roundtrip OK');
}
