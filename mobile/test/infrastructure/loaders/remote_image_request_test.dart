import 'dart:ffi';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:ffi/ffi.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage',
    RemoteImageApi.pigeonChannelCodec,
  );
  late List<Object?> args;

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, (
      message,
    ) async {
      args = message! as List<Object?>;
      return <Object?>[null];
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, null);
  });

  Future<ui.Image> loadEncoded(String path, ui.Size size) async {
    final bytes = await File(path).readAsBytes();
    final pointer = malloc<Uint8>(bytes.length)..asTypedList(bytes.length).setAll(0, bytes);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, (
      message,
    ) async {
      return <Object?>[
        <Object?, Object?>{'pointer': pointer.address, 'length': bytes.length},
      ];
    });
    final request = RemoteImageRequest(uri: 'https://example.test/fallback', size: size);

    return (await request.load((_, {getTargetSize}) => throw UnimplementedError()))!.image;
  }

  test('passes the requested decode size to the platform', () async {
    final request = RemoteImageRequest(uri: 'https://example.test/thumbnail', size: const ui.Size(320, 180));

    await request.load((_, {getTargetSize}) => throw UnimplementedError());

    expect(args[0], 'https://example.test/thumbnail');
    expect(args[2], isFalse);
    expect(args[3], 320);
    expect(args[4], 180);
  });

  test('leaves encoded animation requests unbounded', () async {
    final request = RemoteImageRequest(uri: 'https://example.test/animation', size: const ui.Size(320, 180));

    await request.loadCodec();

    expect(args[2], isTrue);
    expect(args[3], 0);
    expect(args[4], 0);
  });

  test('keeps portrait cover quality in a wide tile', () async {
    final image = await loadEncoded('assets/feature_message/ocr.webp', const ui.Size(963, 642));

    expect(image.width, 963);
    expect(image.height, 1453);
    image.dispose();
  });

  test('preserves cover quality for extreme aspect ratios', () async {
    final image = await loadEncoded('assets/immich-logo-inline-light.png', const ui.Size.square(320));

    expect(image.width, 1311);
    expect(image.height, 320);
    image.dispose();
  });

  test('does not upscale encoded fallback', () async {
    final image = await loadEncoded('assets/feature_message/ocr.webp', const ui.Size.square(2000));

    expect(image.width, 1206);
    expect(image.height, 1819);
    image.dispose();
  });

  test('uses the decode size in the provider cache key', () {
    final small = RemoteImageProvider(url: 'https://example.test/thumbnail', size: const ui.Size.square(160));
    final large = RemoteImageProvider(url: 'https://example.test/thumbnail', size: const ui.Size.square(320));

    expect(small, isNot(large));
  });
}
