// Host FFI roundtrip — `flutter test` builds the hook for the host platform and
// resolves the @Native symbols, no device needed. Calls the generated bindings
// directly (the package's actual surface); device runs: mobile/integration_test.
import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';

Uint8List _px1010102(int r, int g, int b, int a) {
  final px =
      (r & 0x3FF) |
      ((g & 0x3FF) << 10) |
      ((b & 0x3FF) << 20) |
      ((a & 0x3) << 30);
  return Uint8List(4)..buffer.asByteData().setUint32(0, px, Endian.little);
}

typedef _ImageFn =
    bool Function(Pointer<Uint8> src, int dstLen, Pointer<Uint8> dst);

// malloc src+dst, run the native call, return the dst bytes (or null if it declined).
Uint8List? _withBuffers(Uint8List src, int dstLen, _ImageFn call) {
  final srcPtr = malloc<Uint8>(src.length);
  final dstPtr = malloc<Uint8>(dstLen);
  try {
    srcPtr.asTypedList(src.length).setAll(0, src);
    if (!call(srcPtr, dstLen, dstPtr)) {
      return null;
    }
    return Uint8List.fromList(dstPtr.asTypedList(dstLen));
  } finally {
    malloc.free(srcPtr);
    malloc.free(dstPtr);
  }
}

void main() {
  test('core loads: version roundtrips through the C string contract', () {
    final ptr = immich_core_version();
    expect(ptr, isNot(equals(nullptr)));
    final version = ptr.cast<Utf8>().toDartString();
    immich_core_free_string(ptr);
    expect(version, isNotEmpty);
  });

  test('orientation swaps dims exactly for the 90/270/transpose family', () {
    for (final o in [5, 6, 7, 8]) {
      expect(immich_core_orientation_swaps_dims(o), isTrue, reason: 'o=$o');
    }
    for (final o in [0, 1, 2, 3, 4, 9]) {
      expect(immich_core_orientation_swaps_dims(o), isFalse, reason: 'o=$o');
    }
  });

  test('exif rotate: 180 reverses pixels, 90 swaps dims', () {
    // 2x1 image: red, green (RGBA).
    final src = Uint8List.fromList([255, 0, 0, 255, 0, 255, 0, 255]);
    final r180 = _withBuffers(
      src,
      8,
      (s, len, d) =>
          immich_core_rotate_rgba8888(s, src.length, 8, 2, 1, 3, d, len),
    );
    expect(r180, [0, 255, 0, 255, 255, 0, 0, 255]); // green, red

    final r90 = _withBuffers(
      src,
      8,
      (s, len, d) =>
          immich_core_rotate_rgba8888(s, src.length, 8, 2, 1, 6, d, len),
    );
    expect(r90, isNotNull); // 90 -> 1x2, same byte count
  });

  test('rotate declines bad sizes instead of writing', () {
    final src = Uint8List(16);
    final tooSmall = _withBuffers(
      src,
      4,
      (s, len, d) =>
          immich_core_rotate_rgba8888(s, src.length, 8, 2, 2, 6, d, len),
    );
    expect(tooSmall, isNull);
  });

  test('10-bit convert matches the on-device Skia ground truth', () {
    // 179->45 and 111->28 pin round(v*255/1023); a plain >>2 would give 44/27.
    final src = Uint8List.fromList([
      ..._px1010102(1023, 0, 0, 3),
      ..._px1010102(179, 111, 0, 3),
    ]);
    final out = _withBuffers(
      src,
      8,
      (s, len, d) =>
          immich_core_rgba1010102_to_rgba8888(s, src.length, 8, 2, 1, d, len),
    );
    expect(out, isNotNull);
    expect(out!.sublist(0, 4), [255, 0, 0, 255]);
    expect(out.sublist(4, 8), [45, 28, 0, 255]);
  });

  test('convert declines bad sizes instead of writing', () {
    final src = Uint8List(16);
    final badStride = _withBuffers(
      src,
      16,
      (s, len, d) =>
          immich_core_rgba1010102_to_rgba8888(s, src.length, 4, 2, 2, d, len),
    );
    expect(badStride, isNull);
  });

  test('thumbhash decodes via the core: dims then fill', () {
    final hash = base64Decode('1QcSHQRnh493V4dIh4eXh1h4kJUI');
    final hashPtr = malloc<Uint8>(hash.length);
    final w = malloc<Uint32>();
    final h = malloc<Uint32>();
    try {
      hashPtr.asTypedList(hash.length).setAll(0, hash);
      expect(immich_core_thumbhash_dims(hashPtr, hash.length, w, h), isTrue);
      expect((w.value, h.value), (23, 32));

      final len = w.value * h.value * 4;
      final dst = malloc<Uint8>(len);
      try {
        expect(
          immich_core_thumbhash_to_rgba(hashPtr, hash.length, dst, len),
          isTrue,
        );
        final pixels = dst.asTypedList(len);
        for (var i = 3; i < len; i += 4) {
          expect(pixels[i], 255, reason: 'alpha at $i');
        }
        expect(pixels.toSet().length, greaterThan(2));
      } finally {
        malloc.free(dst);
      }

      expect(immich_core_thumbhash_dims(hashPtr, 4, w, h), isFalse);
    } finally {
      malloc.free(hashPtr);
      malloc.free(w);
      malloc.free(h);
    }
  });
}
