import 'dart:ffi';
import 'dart:io';

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
  final name = Platform.isMacOS
      ? 'libimmich_core_ffi.dylib'
      : Platform.isLinux
      ? 'libimmich_core_ffi.so'
      : Platform.isWindows
      ? 'immich_core_ffi.dll'
      : throw UnsupportedError('Unsupported host: ${Platform.operatingSystem}');
  final libPath = args.isNotEmpty
      ? args.first
      : File.fromUri(Platform.script.resolve('../target/debug/$name')).path;
  final lib = DynamicLibrary.open(libPath);

  final version = lib.lookupFunction<_VersionNative, _VersionNative>(
    'immich_core_version',
  );
  final free = lib.lookupFunction<_FreeNative, _FreeDart>(
    'immich_core_free_string',
  );

  final ptr = version();
  print('DART core_version = ${_readCString(ptr)}');
  free(ptr);
  print('DART roundtrip OK');
}
