import 'dart:ffi';

import 'package:ffi/ffi.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

const _requestImageChannel = 'dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage';

const _palette = [
  Color(0xFF4B6BFB),
  Color(0xFF12A08A),
  Color(0xFFE0913A),
  Color(0xFFB4508E),
  Color(0xFF3E9BD6),
  Color(0xFF7A57C9),
];

/// Mocks requests for thumbnails with an empty result
void useUnresolvedThumbnails() {
  final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  messenger.setMockMessageHandler(
    _requestImageChannel,
    (message) async => const StandardMessageCodec().encodeMessage([null]),
  );

  addTearDown(() => messenger.setMockMessageHandler(_requestImageChannel, null));
}

/// Mocks requests for thumbnails with raw pixels consisting of solid colors
void useFakeThumbnails({int size = 8}) {
  final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  messenger.setMockMessageHandler(_requestImageChannel, (message) async {
    final arguments = const StandardMessageCodec().decodeMessage(message)! as List<Object?>;

    // Use the raw URL to pick a color so its deterministic
    final color = _palette[_paletteIndex(arguments.first! as String)];

    // This will be freed in `_fromDecodedPlatformImage`, as with the native buffer (besides, it's just a test)
    final pixels = malloc<Uint8>(size * size * 4);

    for (var i = 0; i < size * size; i++) {
      pixels[i * 4] = (color.r * 255).round();
      pixels[i * 4 + 1] = (color.g * 255).round();
      pixels[i * 4 + 2] = (color.b * 255).round();
      pixels[i * 4 + 3] = 0xFF;
    }

    return const StandardMessageCodec().encodeMessage([
      {'pointer': pixels.address, 'width': size, 'height': size, 'rowBytes': size * 4},
    ]);
  });

  addTearDown(() => messenger.setMockMessageHandler(_requestImageChannel, null));
}

// Custom hash as Dart hash is not stable accross versions
int _paletteIndex(String url) => url.codeUnits.fold(0, (sum, unit) => sum + unit) % _palette.length;
