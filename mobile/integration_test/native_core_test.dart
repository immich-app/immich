// Plumbing check: proves immich_native_core is usable from the real immich app on
// a real device/sim — the build-hook compiled the Rust for this target, the code
// asset bundled into the app, and the @Native symbols resolve at runtime.
// Self-contained: does NOT boot the immich app or need a server.
//
// Run:  flutter test integration_test/native_core_test.dart -d <device>
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  test('native core loads: coreVersion is non-empty', () {
    expect(coreVersion(), isNotEmpty);
  });

  test('sha1Hex matches the FIPS-180 vector', () {
    expect(
      sha1Hex(Uint8List.fromList(utf8.encode('abc'))),
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    );
  });

  test('rotateRgba8888 (the PR #29337 algorithm) rotates 180', () {
    // 2x1: red, green -> green, red
    final src = Uint8List.fromList([255, 0, 0, 255, 0, 255, 0, 255]);
    expect(rotateRgba8888(src, 8, 2, 1, 3), [0, 255, 0, 255, 255, 0, 0, 255]);
  });
}
