import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';
import 'package:integration_test/integration_test.dart';

Uint8List _px1010102(int r, int g, int b, int a) {
  final px = (r & 0x3FF) | ((g & 0x3FF) << 10) | ((b & 0x3FF) << 20) | ((a & 0x3) << 30);
  return Uint8List(4)..buffer.asByteData().setUint32(0, px, Endian.little);
}

Uint8List? _withBuffers(
  Uint8List src,
  int dstLen,
  bool Function(Pointer<Uint8> src, int dstLen, Pointer<Uint8> dst) call,
) {
  final srcPtr = calloc<Uint8>(src.length);
  final dstPtr = calloc<Uint8>(dstLen);
  try {
    srcPtr.asTypedList(src.length).setAll(0, src);
    if (!call(srcPtr, dstLen, dstPtr)) {
      return null;
    }
    return Uint8List.fromList(dstPtr.asTypedList(dstLen));
  } finally {
    calloc.free(srcPtr);
    calloc.free(dstPtr);
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  test('loads the native core', () {
    final ptr = immich_core_version();
    expect(ptr, isNot(equals(nullptr)));
    final version = ptr.cast<Utf8>().toDartString();
    immich_core_free_string(ptr);
    expect(version, isNotEmpty);
  });

  test('reports swapped orientations', () {
    for (final o in [5, 6, 7, 8]) {
      expect(immich_core_orientation_swaps_dims(o), isTrue, reason: 'o=$o');
    }
    for (final o in [0, 1, 2, 3, 4, 9]) {
      expect(immich_core_orientation_swaps_dims(o), isFalse, reason: 'o=$o');
    }
  });

  test('rotates RGBA pixels', () {
    final src = Uint8List.fromList([255, 0, 0, 255, 0, 255, 0, 255]);
    final out = _withBuffers(src, 8, (s, len, d) => immich_core_rotate_rgba8888(s, src.length, 8, 2, 1, 3, d, len));
    expect(out, [0, 255, 0, 255, 255, 0, 0, 255]);
  });

  test('converts RGBA_1010102 pixels', () {
    // 179 and 111 distinguish rounded scaling from `>> 2`.
    final src = Uint8List.fromList([..._px1010102(1023, 0, 0, 3), ..._px1010102(179, 111, 0, 3)]);
    final out = _withBuffers(
      src,
      8,
      (s, len, d) => immich_core_rgba1010102_to_rgba8888(s, src.length, 8, 2, 1, d, len),
    );
    expect(out, isNotNull);
    expect(out!.sublist(0, 4), [255, 0, 0, 255]);
    expect(out.sublist(4, 8), [45, 28, 0, 255]);
  });

  test('decodes a thumbhash', () {
    final hash = base64Decode('1QcSHQRnh493V4dIh4eXh1h4kJUI');
    final hashPtr = malloc<Uint8>(hash.length);
    final info = malloc<Uint32>(3);
    try {
      hashPtr.asTypedList(hash.length).setAll(0, hash);
      final ptr = immich_core_thumbhash_decode(hashPtr, hash.length, info);
      expect(ptr, isNot(equals(nullptr)));
      expect((info[0], info[1], info[2]), (23, 32, 23 * 4));

      final len = info[0] * info[1] * 4;
      final pixels = ptr.asTypedList(len);
      for (var i = 3; i < len; i += 4) {
        expect(pixels[i], 255, reason: 'alpha at $i');
      }
      expect(pixels.toSet().length, greaterThan(2));
      immich_core_free(ptr);

      expect(immich_core_thumbhash_decode(hashPtr, 4, info), equals(nullptr));
    } finally {
      malloc.free(hashPtr);
      malloc.free(info);
    }
  });
}
