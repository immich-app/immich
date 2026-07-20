import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:typed_data';

import 'package:device_info_plus/device_info_plus.dart';
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

// 16x12 linear DNG with EXIF orientation 6; the pixel strip is appended below.
const _fixtureOrientedDngHeaderB64 =
    'SUkqAAgAAAAVAAABAwABAAAAEAAAAAEBAwABAAAADAAAAAIBAwADAAAACgEAAAMBAwABAAAAAQAAAAYBAwABAAAATIgAAAoB'
    'AwABAAAAAQAAABEBBAABAAAAvAEAABIBAwABAAAABgAAABUBAwABAAAAAwAAABYBAwABAAAADAAAABcBBAABAAAAgAQAABwB'
    'AwABAAAAAQAAACkBAwACAAAAAAABAD4BBQACAAAAEAEAAD8BBQAGAAAAIAEAABLGAQAEAAAAAQQAABPGAQAEAAAAAQEAABTG'
    'AgAMAAAAUAEAACHGCgAJAAAAXAEAACjGBQADAAAApAEAAFrGAwABAAAAFQAAAAAAAAAQABAAEAA3GqAAAAAAAiuHCgAAACAA'
    'hetRAAAAgADD9agAAAAAAs3MTAAAAAABzcxMAAAAgADNzEwAAAAAAo/C9QAAAAAQSW1taWNoIFRlc3QAAQAAAAEAAAAAAAAA'
    'AQAAAAAAAAABAAAAAAAAAAEAAAABAAAAAQAAAAAAAAABAAAAAAAAAAEAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAA'
    'AQAAAAEAAAABAAAA';

Uint8List _orientedDng() {
  final header = base64Decode(_fixtureOrientedDngHeaderB64);
  final pixels = ByteData(16 * 12 * 6);
  for (var y = 0; y < 12; y++) {
    final r = (11 - y) * 65535 ~/ 11;
    final b = y * 65535 ~/ 11;
    for (var x = 0; x < 16; x++) {
      final offset = (y * 16 + x) * 6;
      pixels.setUint16(offset, r, Endian.little);
      pixels.setUint16(offset + 2, 0, Endian.little);
      pixels.setUint16(offset + 4, b, Endian.little);
    }
  }
  return Uint8List(header.length + pixels.lengthInBytes)
    ..setAll(0, header)
    ..setAll(header.length, pixels.buffer.asUint8List());
}

Uint8List _read(int address, int length) => Uint8List.fromList(Pointer<Uint8>.fromAddress(address).asTypedList(length));

void _free(int address) => malloc.free(Pointer<Uint8>.fromAddress(address));

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  if (!Platform.isAndroid) {
    return;
  }

  final api = LocalImageApi();
  final fixture = base64Decode(_fixture10BitAvifB64);
  String? assetId;
  String? orientedAssetId;

  setUpAll(() async {
    await PhotoManager.setIgnorePermissionCheck(true);
    final entity = await PhotoManager.editor.saveImage(fixture, filename: 'immich_jni_fixture.avif');
    assetId = entity.id;
  });

  tearDownAll(() async {
    final ids = [assetId, orientedAssetId].whereType<String>().toList();
    if (ids.isNotEmpty) {
      try {
        await PhotoManager.editor.deleteWithIds(ids);
      } catch (_) {}
    }
  });

  test('thumbhash JNI roundtrip', () async {
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
    expect(pixelsA, pixelsB);
    expect(pixelsA.toSet().length, greaterThan(1));
  });

  test('encoded image buffer roundtrip', () async {
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

  test('10-bit decode runs NativeImage.convert1010102', () async {
    final Map<String, int>? res;
    try {
      res = await api.requestImage(
        assetId!,
        requestId: 900002,
        width: 0,
        height: 0,
        isVideo: false,
        preferEncoded: false,
      );
    } on PlatformException catch (e) {
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
    final source1010102 = res['source1010102'];
    expect(source1010102, isNotNull, reason: 'decode result did not report its source format');
    if (source1010102 == 0) {
      markTestSkipped('device decoded the 10-bit AVIF fixture without RGBA_1010102');
      return;
    }
    expect(source1010102, 1);
    expect(
      res['converted1010102'],
      1,
      reason: 'RGBA_1010102 source fell back instead of running the native conversion',
    );
    for (final (x, y) in [(2, 2), (32, 32), (61, 61)]) {
      final o = (y * w + x) * 4;
      expect(pixels[o], closeTo(45, 12), reason: 'R at ($x,$y)');
      expect(pixels[o + 1], closeTo(139, 12), reason: 'G at ($x,$y)');
      expect(pixels[o + 2], closeTo(107, 12), reason: 'B at ($x,$y)');
      expect(pixels[o + 3], 255, reason: 'A at ($x,$y)');
    }
  });

  test('raw EXIF orientation rotates through NativeImage.rotate', () async {
    final sdkInt = (await DeviceInfoPlugin().androidInfo).version.sdkInt;
    if (sdkInt < 29) {
      markTestSkipped('raw image rotation needs Android 10 or newer');
      return;
    }
    final entity = await PhotoManager.editor.saveImage(_orientedDng(), filename: 'immich_jni_orientation.dng');
    orientedAssetId = entity.id;
    expect(await entity.mimeTypeAsync, anyOf('image/dng', 'image/x-adobe-dng'));
    expect(entity.orientation, 90);
    expect((entity.width, entity.height), (16, 12));

    final Map<String, int>? res;
    try {
      res = await api.requestImage(
        entity.id,
        requestId: 900003,
        width: 0,
        height: 0,
        isVideo: false,
        preferEncoded: false,
      );
    } on PlatformException catch (e) {
      markTestSkipped('device cannot decode the DNG fixture: ${e.message}');
      return;
    }
    expect(res, isNotNull);
    final (w, h, rowBytes) = (res!['width']!, res['height']!, res['rowBytes']!);
    expect((w, h, rowBytes), (12, 16, 48));
    final pixels = _read(res['pointer']!, rowBytes * h);
    _free(res['pointer']!);
    for (final (x, r, b) in [(0, 0, 255), (11, 255, 0)]) {
      final o = 8 * rowBytes + x * 4;
      expect(pixels[o], closeTo(r, 12), reason: 'R at ($x,8)');
      expect(pixels[o + 2], closeTo(b, 12), reason: 'B at ($x,8)');
    }
  });
}
