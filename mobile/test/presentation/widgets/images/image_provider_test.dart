import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

void main() {
  const api = 'dev.flutter.pigeon.immich_mobile.RemoteImageApi';
  const requestImage = BasicMessageChannel<Object?>('$api.requestImage', RemoteImageApi.pigeonChannelCodec);
  const cancelRequest = BasicMessageChannel<Object?>('$api.cancelRequest', RemoteImageApi.pigeonChannelCodec);

  testWidgets('a face url that changes while the avatar animates still loads', (tester) async {
    final inFlight = <Object?, Object?>{};
    tester.binding.defaultBinaryMessenger
      ..setMockDecodedMessageHandler<Object?>(requestImage, (message) {
        final [url, id, ...] = message! as List<Object?>;
        inFlight[id] = url;
        return Completer<Object?>().future;
      })
      ..setMockDecodedMessageHandler<Object?>(cancelRequest, (message) async {
        inFlight.remove((message! as List<Object?>).first);
        return const <Object?>[null];
      });
    Widget avatar(String url) => MaterialApp(
      home: CircleAvatar(backgroundImage: RemoteImageProvider(url: url)),
    );

    await tester.pumpWidget(avatar('https://example.test/before'));
    await tester.pumpWidget(avatar('https://example.test/after'));
    await tester.pumpAndSettle();

    expect(inFlight.values, ['https://example.test/after']);
  });

  testWidgets('a cancelled load that fails late keeps the next load of the same image', (tester) async {
    final replies = <Completer<Object?>>[];
    tester.binding.defaultBinaryMessenger
      ..setMockDecodedMessageHandler<Object?>(requestImage, (_) {
        replies.add(Completer<Object?>());
        return replies.last.future;
      })
      ..setMockDecodedMessageHandler<Object?>(cancelRequest, (_) async => const <Object?>[null]);
    const provider = RemoteImageProvider(url: 'https://example.test/face');
    final listener = ImageStreamListener((_, _) {});

    final first = provider.resolve(ImageConfiguration.empty)..addListener(listener);
    await tester.pump();
    first.removeListener(listener);
    provider.resolve(ImageConfiguration.empty).addListener(listener);
    await tester.pump();
    expect(replies, hasLength(2));
    replies.first.complete(const <Object?>['error', 'late failure', null]);
    await tester.pump();

    expect(PaintingBinding.instance.imageCache.statusForKey(provider).pending, isTrue);
  });
}
