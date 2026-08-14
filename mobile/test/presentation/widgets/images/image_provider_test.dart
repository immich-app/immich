import 'dart:async';
import 'dart:ffi' hide Size;

import 'package:ffi/ffi.dart';
import 'package:flutter/painting.dart';
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

ImageStreamListener _frameTo(Completer<ImageInfo> completer) => ImageStreamListener(
  (image, _) {
    if (!completer.isCompleted) {
      completer.complete(image);
    }
  },
  onError: (e, s) {
    if (!completer.isCompleted) {
      completer.completeError(e, s);
    }
  },
);

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

  testWidgets('re-resolving after a cancelled load still produces a frame', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('RemoteImageApi', RemoteImageApi.pigeonChannelCodec)..install(tester);
      const provider = RemoteImageProvider(url: 'https://example.com/1.jpg');

      final gone = ImageStreamListener((_, __) {});
      final stream1 = provider.resolve(ImageConfiguration.empty)..addListener(gone);
      await _until(() => host.started.length == 1, 'the first request');
      stream1.removeListener(gone);
      await _until(() => host.cancelled.contains(host.started.first), 'the first request to be cancelled');

      final frame = Completer<ImageInfo>();
      final listener = _frameTo(frame);
      final stream2 = provider.resolve(ImageConfiguration.empty)..addListener(listener);
      await _until(() => host.started.length == 2, 'a second request after the cancel');
      host.complete(host.started[1], _rgbaReply());

      final image = await frame.future;
      expect(image.image.width, 1);
      expect(cache.statusForKey(provider).pending, isFalse);
      stream2.removeListener(listener);
      image.dispose();
      await host.settle();
    });
  });

  testWidgets('a finished image stays cached after the last listener leaves', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('RemoteImageApi', RemoteImageApi.pigeonChannelCodec)..install(tester);
      const provider = RemoteImageProvider(url: 'https://example.com/3.jpg');

      final frame = Completer<ImageInfo>();
      final listener = _frameTo(frame);
      final stream = provider.resolve(ImageConfiguration.empty)..addListener(listener);
      await _until(() => host.started.length == 1, 'the request');
      host.complete(host.started.first, _rgbaReply());
      (await frame.future).dispose();

      stream.removeListener(listener);
      expect(cache.containsKey(provider), isTrue);

      final replay = Completer<ImageInfo>();
      final replayListener = _frameTo(replay);
      final replayStream = provider.resolve(ImageConfiguration.empty)..addListener(replayListener);
      final replayed = await replay.future;
      expect(replayed.image.width, 1);
      expect(host.started, hasLength(1));
      replayStream.removeListener(replayListener);
      replayed.dispose();
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

      final fullListener = ImageStreamListener((_, __) {});
      final fullStream = full.resolve(ImageConfiguration.empty)..addListener(fullListener);
      await _until(() => host.started.length == 1, 'the thumbnail request');
      final thumbRequest = host.started.first;

      // A second widget shares the same thumbnail entry.
      const thumb = LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'c1');
      final thumbFrame = Completer<ImageInfo>();
      final thumbListener = _frameTo(thumbFrame);
      final thumbStream = thumb.resolve(ImageConfiguration.empty)..addListener(thumbListener);

      fullStream.removeListener(fullListener);
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(host.cancelled, isNot(contains(thumbRequest)));
      expect(host.started, hasLength(1));

      host.complete(thumbRequest, _rgbaReply());
      final thumbImage = await thumbFrame.future;
      expect(thumbImage.image.width, 1);
      thumbStream.removeListener(thumbListener);
      thumbImage.dispose();
      await host.settle();
    });
  });

  testWidgets('a stale load finishing late cannot break the next load\'s cancel', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('RemoteImageApi', RemoteImageApi.pigeonChannelCodec)..install(tester);
      const provider = RemoteImageProvider(url: 'https://example.com/5.jpg');

      final gone = ImageStreamListener((_, __) {});
      final stream1 = provider.resolve(ImageConfiguration.empty)..addListener(gone);
      await _until(() => host.started.length == 1, 'the first request');
      final first = host.started.first;
      stream1.removeListener(gone);
      await _until(() => host.cancelled.contains(first), 'the first request to be cancelled');

      final second = ImageStreamListener((_, __) {});
      final stream2 = provider.resolve(ImageConfiguration.empty)..addListener(second);
      await _until(() => host.started.length == 2, 'a second request after the cancel');

      host.complete(first, null);
      await Future<void>.delayed(const Duration(milliseconds: 50));

      stream2.removeListener(second);
      await _until(() => host.cancelled.contains(host.started[1]), 'the second request to be cancelled');
      expect(cache.statusForKey(provider).pending, isFalse);
      await host.settle();
    });
  });

  testWidgets('an abandoned animated load failing late cannot evict the next load', (tester) async {
    await tester.runAsync(() async {
      host = _FakeImageHost('LocalImageApi', LocalImageApi.pigeonChannelCodec)..install(tester);
      const provider = LocalFullImageProvider(
        id: 'asset-2',
        assetType: AssetType.image,
        size: Size(100, 100),
        isAnimated: true,
        checksum: 'c2',
      );

      final gone = ImageStreamListener((image, _) => image.dispose());
      final stream1 = provider.resolve(ImageConfiguration.empty)..addListener(gone);
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

      final second = ImageStreamListener((_, __) {});
      final stream2 = provider.resolve(ImageConfiguration.empty)..addListener(second);
      await _until(() => host.started.length == 4, 'the next load to start');

      host.fail(original);
      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(cache.statusForKey(provider).pending, isTrue);
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
