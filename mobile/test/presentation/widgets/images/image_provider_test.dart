import 'dart:async';
import 'dart:ffi' hide Size;

import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/local_image_api.g.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

class _ImageHost {
  _ImageHost(WidgetTester tester, String api, MessageCodec<Object?> codec) {
    final messenger = tester.binding.defaultBinaryMessenger;
    BasicMessageChannel<Object?> channel(String method) =>
        BasicMessageChannel<Object?>('dev.flutter.pigeon.immich_mobile.$api.$method', codec);
    final request = channel('requestImage');
    final cancel = channel('cancelRequest');

    messenger.setMockDecodedMessageHandler<Object?>(request, (message) async {
      final id = (message! as List<Object?>)[1]! as int;
      started.add(id);
      final reply = Completer<List<Object?>>();
      _pending[id] = reply;
      return reply.future;
    });
    messenger.setMockDecodedMessageHandler<Object?>(cancel, (message) async {
      cancelled.add((message! as List<Object?>)[0]! as int);
      return const <Object?>[null];
    });
    addTearDown(() async {
      for (final id in _pending.keys.toList()) {
        expect(cancelled, contains(id));
        _pending.remove(id)!.complete(const <Object?>[null]);
      }
      await Future<void>.delayed(const Duration(milliseconds: 1));
      messenger.setMockDecodedMessageHandler<Object?>(request, null);
      messenger.setMockDecodedMessageHandler<Object?>(cancel, null);
    });
  }

  final started = <int>[];
  final cancelled = <int>[];
  final _pending = <int, Completer<List<Object?>>>{};

  Iterable<int> get live => _pending.keys.where((id) => !cancelled.contains(id));

  void complete(int id) => _pending.remove(id)!.complete(<Object?>[_rgbaReply()]);

  void fail(int id) => _pending.remove(id)!.complete(const <Object?>['failed', 'request failed', null]);
}

Map<String, int> _rgbaReply() {
  final pointer = malloc.allocate<Uint8>(4);
  pointer.asTypedList(4).setAll(0, const [0, 255, 0, 255]);
  return {'pointer': pointer.address, 'width': 1, 'height': 1, 'rowBytes': 4};
}

LocalFullImageProvider _full(String id, {bool animated = false}) => LocalFullImageProvider(
  id: id,
  assetType: AssetType.image,
  size: const Size(100, 100),
  isAnimated: animated,
  checksum: id,
);

Future<void> _until(bool Function() condition, String reason) async {
  final deadline = DateTime.now().add(const Duration(seconds: 5));
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('timed out waiting for $reason');
    }
    await Future<void>.delayed(const Duration(milliseconds: 1));
  }
}

void main() {
  late ImageCache cache;

  setUp(() {
    cache = PaintingBinding.instance.imageCache
      ..clear()
      ..clearLiveImages();
  });

  testWidgets('a face url that changes while the avatar animates still loads', (tester) async {
    await tester.runAsync(() async {
      final host = _ImageHost(tester, 'RemoteImageApi', RemoteImageApi.pigeonChannelCodec);
      RemoteImageProvider image(String url) => RemoteImageProvider(url: url);
      final before = image('https://example.com/before.jpg');
      final after = image('https://example.com/after.jpg');
      Widget avatar(ImageProvider image) => MaterialApp(home: CircleAvatar(backgroundImage: image));

      await tester.pumpWidget(avatar(before));
      await _until(() => host.started.length == 1, 'the first face request');
      host.complete(host.started.single);
      await _until(() => cache.statusForKey(before).keepAlive, 'the first face to be cached');

      await tester.pumpWidget(avatar(after));
      await tester.pumpAndSettle();

      expect(host.live, hasLength(1), reason: 'the new face url has no request left after the animation');
      host.complete(host.live.single);
      await _until(() => cache.statusForKey(after).keepAlive, 'the new face to be cached');
    });
  });

  testWidgets('cancelling the full image keeps a shared thumbnail loading', (tester) async {
    await tester.runAsync(() async {
      final host = _ImageHost(tester, 'LocalImageApi', LocalImageApi.pigeonChannelCodec);
      final full = _full('asset-1');
      final thumb = LocalThumbProvider(id: full.id, assetType: full.assetType, checksum: full.checksum);

      final fullListener = ImageStreamListener((_, _) {});
      final fullStream = full.resolve(ImageConfiguration.empty)..addListener(fullListener);
      await _until(() => host.started.length == 1, 'the thumbnail request');
      final thumbRequest = host.started.single;

      final thumbListener = ImageStreamListener((_, _) {});
      final thumbStream = thumb.resolve(ImageConfiguration.empty)..addListener(thumbListener);

      fullStream.removeListener(fullListener);
      expect(host.cancelled, isNot(contains(thumbRequest)));

      host.complete(thumbRequest);
      await _until(() => cache.statusForKey(thumb).keepAlive, 'the shared thumbnail to finish');
      thumbStream.removeListener(thumbListener);
    });
  });

  testWidgets('an abandoned animated load failing late cannot evict the next load', (tester) async {
    await tester.runAsync(() async {
      final host = _ImageHost(tester, 'LocalImageApi', LocalImageApi.pigeonChannelCodec);
      final abandoned = _full('asset-2', animated: true);
      final gone = ImageStreamListener((image, _) => image.dispose());
      final stream1 = abandoned.resolve(ImageConfiguration.empty)..addListener(gone);
      await _until(() => host.started.length == 1, 'the thumbnail request');
      host.complete(host.started.first);
      await _until(() => host.started.length == 2, 'the preview request');
      host.complete(host.started[1]);
      await _until(() => host.started.length == 3, 'the encoded original request');
      final original = host.started[2];

      stream1.removeListener(gone);
      await _until(() => host.cancelled.contains(original), 'the original request to be cancelled');

      final retry = _full('asset-2', animated: true);
      expect(retry, abandoned);
      expect(identical(retry, abandoned), isFalse);
      final second = ImageStreamListener((_, _) {});
      final stream2 = retry.resolve(ImageConfiguration.empty)..addListener(second);
      await _until(() => host.started.length == 4, 'the next load to start');
      expect(cache.statusForKey(retry).keepAlive, isTrue);

      host.fail(original);
      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(cache.statusForKey(retry).keepAlive, isTrue);
      expect(host.cancelled, isNot(contains(host.started[3])));
      // Abandoned animated loads close without a codec.
      expect(tester.takeException(), isA<StateError>());

      stream2.removeListener(second);
      await _until(() => host.cancelled.contains(host.started[3]), 'the next load to wind down');
    });
  });
}
