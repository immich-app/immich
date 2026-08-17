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

// Hand-driven pigeon host: requests stay pending until the test completes them,
// so cancellation ordering can be controlled exactly.
class _FakeImageHost {
  _FakeImageHost(this.api, this.codec);

  final String api;
  final MessageCodec<Object?> codec;
  final started = <int>[];
  final cancelled = <int>[];
  final _pending = <int, Completer<List<Object?>>>{};

  Iterable<int> get unsettled => _pending.keys;

  Iterable<int> get live => _pending.keys.where((id) => !cancelled.contains(id));

  void install(WidgetTester tester) {
    final messenger = tester.binding.defaultBinaryMessenger;
    messenger.setMockDecodedMessageHandler<Object?>(_channel('requestImage'), (message) async {
      final requestId = (message! as List<Object?>)[1]! as int;
      started.add(requestId);
      final completer = Completer<List<Object?>>();
      _pending[requestId] = completer;
      return completer.future;
    });
    messenger.setMockDecodedMessageHandler<Object?>(_channel('cancelRequest'), (message) async {
      cancelled.add((message! as List<Object?>)[0]! as int);
      return const <Object?>[null];
    });
  }

  void uninstall() {
    final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    messenger.setMockDecodedMessageHandler<Object?>(_channel('requestImage'), null);
    messenger.setMockDecodedMessageHandler<Object?>(_channel('cancelRequest'), null);
  }

  BasicMessageChannel<Object?> _channel(String method) =>
      BasicMessageChannel<Object?>('dev.flutter.pigeon.immich_mobile.$api.$method', codec);

  void complete(int requestId, Map<String, int>? reply) => _pending.remove(requestId)!.complete(<Object?>[reply]);

  void fail(int requestId) => _pending.remove(requestId)!.complete(const <Object?>['failed', 'request failed', null]);

  // Cancelled requests may stay pending mid-test; settle them before the test
  // ends so no platform message is left hanging.
  Future<void> settle() async {
    for (final requestId in _pending.keys.toList()) {
      expect(cancelled, contains(requestId), reason: 'request $requestId was neither completed nor cancelled');
      _pending.remove(requestId)!.complete(const <Object?>[null]);
    }
    await Future<void>.delayed(const Duration(milliseconds: 1));
  }
}

// A decoded 1x1 RGBA frame; the request frees the pointer after upload.
Map<String, int> _rgbaReply() {
  final pointer = malloc.allocate<Uint8>(4);
  pointer.asTypedList(4).setAll(0, const [0, 255, 0, 255]);
  return {'pointer': pointer.address, 'width': 1, 'height': 1, 'rowBytes': 4};
}

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
  late _FakeImageHost host;

  setUp(() {
    cache = PaintingBinding.instance.imageCache
      ..clear()
      ..clearLiveImages();
  });

  tearDown(() {
    host.uninstall();
    expect(host.unsettled, isEmpty);
  });

  // CircleAvatar animates a url change, and on every animation frame it drops its painter and lets a
  // fresh one re-resolve the same provider instance, so the load is cancelled and restarted in between.
  testWidgets('a face url that changes while the avatar animates still loads', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('RemoteImageApi', RemoteImageApi.pigeonChannelCodec)..install(tester);
      const before = 'https://example.com/before.jpg';
      const after = 'https://example.com/after.jpg';
      Widget avatar(String url) => Directionality(
        textDirection: TextDirection.ltr,
        child: MediaQuery(
          data: const MediaQueryData(),
          child: CircleAvatar(backgroundImage: RemoteImageProvider(url: url)),
        ),
      );
      bool cached(String url) => cache.statusForKey(RemoteImageProvider(url: url)).keepAlive;

      await tester.pumpWidget(avatar(before));
      await _until(() => host.started.length == 1, 'the first face request');
      host.complete(host.started.single, _rgbaReply());
      await _until(() => cached(before), 'the first face to be cached');

      await tester.pumpWidget(avatar(after));
      await tester.pumpAndSettle();

      expect(host.live, hasLength(1), reason: 'the new face url has no request left after the animation');
      host.complete(host.live.single, _rgbaReply());
      await _until(() => cached(after), 'the new face to be cached');
      await host.settle();
    });
  });

  testWidgets('cancelling the full image keeps a shared thumbnail loading', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('LocalImageApi', LocalImageApi.pigeonChannelCodec)..install(tester);
      const full = LocalFullImageProvider(
        id: 'asset-1',
        assetType: AssetType.image,
        size: Size(100, 100),
        isAnimated: false,
        checksum: 'c1',
      );
      const thumb = LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'c1');

      final fullListener = ImageStreamListener((_, _) {});
      final fullStream = full.resolve(ImageConfiguration.empty)..addListener(fullListener);
      await _until(() => host.started.length == 1, 'the thumbnail request');
      final thumbRequest = host.started.single;

      // A second widget shares the same thumbnail entry.
      final thumbListener = ImageStreamListener((_, _) {});
      final thumbStream = thumb.resolve(ImageConfiguration.empty)..addListener(thumbListener);

      fullStream.removeListener(fullListener);
      expect(host.cancelled, isNot(contains(thumbRequest)));

      host.complete(thumbRequest, _rgbaReply());
      await _until(() => cache.statusForKey(thumb).keepAlive, 'the shared thumbnail to finish');
      thumbStream.removeListener(thumbListener);
      await host.settle();
    });
  });

  testWidgets('an abandoned animated load failing late cannot evict the next load', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('LocalImageApi', LocalImageApi.pigeonChannelCodec)..install(tester);
      // Built at runtime so the retry is its own instance; a const call would hand back the first one.
      LocalFullImageProvider full(String checksum) => LocalFullImageProvider(
        id: 'asset-2',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: true,
        checksum: checksum,
      );

      final abandoned = full('c2');
      final gone = ImageStreamListener((image, _) => image.dispose());
      final stream1 = abandoned.resolve(ImageConfiguration.empty)..addListener(gone);
      await _until(() => host.started.length == 1, 'the thumbnail request');
      host.complete(host.started.first, _rgbaReply());
      await _until(() => host.started.length == 2, 'the preview request');
      host.complete(host.started[1], _rgbaReply());
      await _until(() => host.started.length == 3, 'the encoded original request');
      final original = host.started[2];

      stream1.removeListener(gone);
      await _until(() => host.cancelled.contains(original), 'the original request to be cancelled');

      // Drop the cached thumbnail so the next load starts pending instead of complete.
      cache.evict(const LocalThumbProvider(id: 'asset-2', assetType: AssetType.image, checksum: 'c2'));

      final retry = full('c2');
      final second = ImageStreamListener((_, _) {});
      final stream2 = retry.resolve(ImageConfiguration.empty)..addListener(second);
      await _until(() => host.started.length == 4, 'the next load to start');

      host.fail(original);
      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(cache.statusForKey(retry).pending, isTrue);
      expect(host.cancelled, isNot(contains(host.started[3])));
      // Abandoned animated loads close without a codec.
      expect(tester.takeException(), isA<StateError>());

      stream2.removeListener(second);
      await _until(() => host.cancelled.contains(host.started[3]), 'the next load to wind down');
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(tester.takeException(), isA<StateError>());
      await host.settle();
    });
  });
}
