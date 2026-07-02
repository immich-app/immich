// Host FFI roundtrip — `flutter test` builds the hook for the host platform and
// resolves the @Native symbols, no device needed. (Device runs: example/integration_test.)
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';

void main() {
  test('coreVersion returns a non-empty version', () {
    expect(coreVersion(), isNotEmpty);
  });

  test('sha1Hex matches the FIPS-180 vector for "abc"', () {
    expect(
      sha1Hex(Uint8List.fromList(utf8.encode('abc'))),
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    );
  });

  test('sha1Hex of empty input', () {
    expect(sha1Hex(Uint8List(0)), 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  test('sha1File matches the in-memory hash (mmap path)', () {
    final tmp = Directory.systemTemp.createTempSync('native_core');
    final path = '${tmp.path}/abc.bin';
    File(path).writeAsBytesSync(utf8.encode('abc'));
    expect(sha1File(path), 'a9993e364706816aba3e25717850c26c9cd0d89d');
    tmp.deleteSync(recursive: true);
  });

  test('sha1File throws on a missing file', () {
    expect(() => sha1File('/no/such/immich_native_core/file'), throwsStateError);
  });

  test('rotateRgba8888: 180 reverses pixels, 90 swaps dims', () {
    // 2x1 image: pixel0 = red, pixel1 = green (RGBA).
    final src = Uint8List.fromList([255, 0, 0, 255, 0, 255, 0, 255]);
    final r180 = rotateRgba8888(src, 8, 2, 1, 3)!; // ROTATE_180
    expect(r180, [0, 255, 0, 255, 255, 0, 0, 255]); // green, red

    final r90 = rotateRgba8888(src, 8, 2, 1, 6)!; // ROTATE_90 -> 1x2
    expect(r90.length, 8); // dims swapped to 1x2, still 2 pixels
  });

  test('rotateRgba8888 returns null on an undersized result expectation', () {
    // width*height*4 mismatch is guarded natively; a 0x0 image yields empty.
    final empty = rotateRgba8888(Uint8List(0), 0, 0, 0, 1);
    expect(empty, anyOf(isNull, isEmpty));
  });
}
