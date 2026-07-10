// JNI-layer check: proves the Rust core's Java_app_alextran_immich_* exports work
// under the real JVM by driving the production kotlin callers through pigeon —
// getThumbhash (NativeBuffer.allocate/wrap), requestImage preferEncoded
// (allocate/wrap + ByteBuffer.put), and a full 10-bit AVIF decode
// (toNativeBuffer -> NativeImage.convert1010102). Buffers come back as raw
// addresses and are freed from dart with malloc.free — the libc-heap handoff the
// whole design depends on. Android only: iOS has no JNI layer.
//
// The fixture is a 327-byte 64x64 solid-color 10-bit AVIF (yuv420p10le, bt709,
// limited range) that decodes to ~(45, 139, 107, 255). On API 33+ it decodes to
// RGBA_1010102 and exercises the rust convert; a device that decodes 10-bit
// straight to 8888 yields the same colors, so the assertions hold either way.
// Misreading 1010102 as rgba8888 (the #24906 bug) would give R~176 and A~218 —
// far outside the tolerance.
//
// Run:  flutter test integration_test/native_jni_test.dart -d <android-device>
// Teardown deletes the seeded fixture, which on API 30+ shows the system
// delete-consent dialog once. All assertions complete before teardown, so the
// pass is settled by then; a headless/CI run just has to confirm the dialog, e.g.
//   adb shell uiautomator dump /sdcard/ui.xml   # then tap the "Allow" node bounds
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/local_image_api.g.dart';
import 'package:integration_test/integration_test.dart';
import 'package:photo_manager/photo_manager.dart';

const _fixture10BitAvifB64 =
    'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAA'
    'AAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MA'
    'AAAARAAAAQABAAAAAQAAASEAAAAmAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNv'
    'bG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAABAAAAAQAAAABBwaXhpAAAAAAMKCgoA'
    'AAAMYXYxQ4EATAAAAAATY29scm5jbHgAAQACAAEAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAu'
    'bWRhdAoNAAAAAq//jV86AgQCCDIVEACLggAAAAAAgAAifC/LKY1kV6Bd';

Uint8List _read(int address, int length) => Uint8List.fromList(Pointer<Uint8>.fromAddress(address).asTypedList(length));

// The kotlin side allocates with libc malloc; freeing from dart via package:ffi
// hits the same process-global libc free. This IS the production ownership flow.
void _free(int address) => malloc.free(Pointer<Uint8>.fromAddress(address));

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  if (!Platform.isAndroid) {
    return;
  }

  final api = LocalImageApi();
  final fixture = base64Decode(_fixture10BitAvifB64);
  String? assetId;

  setUpAll(() async {
    await PhotoManager.setIgnorePermissionCheck(true);
    final entity = await PhotoManager.editor.saveImage(fixture, filename: 'immich_jni_fixture.avif');
    assetId = entity.id;
  });

  tearDownAll(() async {
    if (assetId != null) {
      try {
        await PhotoManager.editor.deleteWithIds([assetId!]);
      } catch (_) {}
    }
  });

  test('thumbhash decodes through NativeBuffer allocate+wrap and dart frees it', () async {
    final a = await api.getThumbhash('1QcSHQRnh493V4dIh4eXh1h4kJUI');
    final b = await api.getThumbhash('1QcSHQRnh493V4dIh4eXh1h4kJUI');
    final (w, h, rowBytes) = (a['width']!, a['height']!, a['rowBytes']!);
    expect(a['pointer'], isNot(0));
    expect(w, inInclusiveRange(1, 128));
    expect(h, inInclusiveRange(1, 128));
    expect(rowBytes, w * 4);

    final pixelsA = _read(a['pointer']!, rowBytes * h);
    final pixelsB = _read(b['pointer']!, rowBytes * h);
    _free(a['pointer']!);
    _free(b['pointer']!);
    // Deterministic math into a correctly wrapped buffer: two runs byte-identical,
    // and a real image decodes to more than one color.
    expect(pixelsA, pixelsB);
    expect(pixelsA.toSet().length, greaterThan(1));
  });

  test('encoded request roundtrips the file bytes through the native buffer', () async {
    final res = await api.requestImage(
      assetId!,
      requestId: 900001,
      width: 0,
      height: 0,
      isVideo: false,
      preferEncoded: true,
    );
    expect(res, isNotNull);
    expect(res!['length'], fixture.length);
    final bytes = _read(res['pointer']!, res['length']!);
    _free(res['pointer']!);
    expect(bytes, fixture);
  });

  test('10-bit decode lands correct colors through NativeImage.convert1010102', () async {
    final Map<String, int>? res;
    try {
      res = await api.requestImage(
        assetId!,
        requestId: 900002,
        width: 0, // unsized -> full-res decode, the load-original path
        height: 0,
        isVideo: false,
        preferEncoded: false,
      );
    } on PlatformException catch (e) {
      // Some devices cannot decode 10-bit AVIF at all (e.g. SM-X115 throws
      // "getPixels failed" before toNativeBuffer runs) — nothing to assert there.
      markTestSkipped('device cannot decode the 10-bit AVIF fixture: ${e.message}');
      return;
    }
    expect(res, isNotNull);
    final (w, h, rowBytes) = (res!['width']!, res['height']!, res['rowBytes']!);
    expect(w, 64);
    expect(h, 64);
    expect(rowBytes, w * 4);

    final pixels = _read(res['pointer']!, rowBytes * h);
    _free(res['pointer']!);
    for (final (x, y) in [(2, 2), (32, 32), (61, 61)]) {
      final o = (y * w + x) * 4;
      expect(pixels[o], closeTo(45, 12), reason: 'R at ($x,$y)');
      expect(pixels[o + 1], closeTo(139, 12), reason: 'G at ($x,$y)');
      expect(pixels[o + 2], closeTo(107, 12), reason: 'B at ($x,$y)');
      expect(pixels[o + 3], 255, reason: 'A at ($x,$y)');
    }
  });
}
