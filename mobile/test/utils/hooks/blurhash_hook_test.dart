import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/utils/hooks/blurhash_hook.dart';

RemoteAsset _asset(String thumbHash) => RemoteAsset(
  id: '1',
  name: 'test.jpg',
  ownerId: '1',
  checksum: 'checksum',
  type: AssetType.image,
  createdAt: DateTime(2024),
  updatedAt: DateTime(2024),
  thumbHash: thumbHash,
  isEdited: false,
);

void main() {
  test('decodes the native RGBA output into a BMP', () async {
    final bmp = decodeDriftThumbHash('1QcSHQRnh493V4dIh4eXh1h4kJUI');

    expect(bmp, isNotNull);
    final data = ByteData.sublistView(bmp!);
    expect(data.getUint16(0, Endian.little), 0x4d42);
    expect(data.getUint32(2, Endian.little), bmp.length);
    expect(data.getInt32(18, Endian.little), 23);
    expect(data.getInt32(22, Endian.little), -32);
    expect(data.getUint16(28, Endian.little), 32);

    final codec = await ui.instantiateImageCodec(bmp);
    final frame = await codec.getNextFrame();
    expect((frame.image.width, frame.image.height), (23, 32));
    frame.image.dispose();
    codec.dispose();
  });

  testWidgets('bad hashes fall back without throwing during build', (tester) async {
    for (final hash in ['not base64!', 'AQIDBA==']) {
      await tester.pumpWidget(
        MaterialApp(
          home: HookBuilder(
            key: UniqueKey(),
            builder: (context) => Text(useDriftBlurHashRef(_asset(hash)).value == null ? 'fallback' : 'decoded'),
          ),
        ),
      );

      expect(find.text('fallback'), findsOneWidget);
      expect(tester.takeException(), isNull);
    }
  });
}
