import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/loaders/thumbhash_decode_scheduler.dart';
import 'package:immich_mobile/platform/local_image_api.g.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.LocalImageApi.getThumbhash',
    LocalImageApi.pigeonChannelCodec,
  );

  final scheduler = ThumbHashDecodeScheduler.instance;
  final cap = ThumbHashDecodeScheduler.maxConcurrentForTesting;
  final depth = ThumbHashDecodeScheduler.maxQueueDepthForTesting;

  late List<String> started;
  late Map<String, Completer<Object?>> pending;
  late Set<String> shouldFail;

  setUp(() {
    // instance is a process-lifetime singleton, so every test starts from a
    // known-empty queue/in-flight count rather than inheriting state left
    // behind by whichever test ran before it.
    scheduler.reset();
    started = [];
    pending = {};
    shouldFail = {};

    // Mocks the native decode call itself: records which thumbhash was asked
    // for and holds the reply open until the test explicitly resolves it, so
    // concurrency/ordering can be observed and controlled directly.
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, (
      message,
    ) async {
      final thumbhash = (message! as List<Object?>)[0]! as String;
      started.add(thumbhash);
      if (shouldFail.contains(thumbhash)) {
        throw PlatformException(code: 'test-decode-failure');
      }
      final result = await pending.putIfAbsent(thumbhash, () => Completer<Object?>()).future;
      return <Object?>[result];
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, null);
  });

  void resolve(String thumbhash) {
    pending[thumbhash]!.complete(<Object?, Object?>{'pointer': 1, 'width': 1, 'height': 1, 'rowBytes': 4});
  }

  test('runs a request immediately when under the concurrency cap', () async {
    final result = scheduler.decode('hash-a', token: 'a');
    resolve('hash-a');

    expect(started, ['hash-a']);
    expect(await result, isNotNull);
  });

  test('queues requests beyond the cap and dispatches the oldest queued one next', () async {
    final hashes = List.generate(cap + 5, (i) => 'hash-$i');
    for (var i = 0; i < hashes.length; i++) {
      unawaited(scheduler.decode(hashes[i], token: i));
    }

    // Only the first `cap` are dispatched yet, in the order they arrived.
    expect(started, hashes.take(cap));

    // Resolving one frees a slot for the oldest still-queued request.
    resolve(hashes[0]);
    await Future<void>.delayed(Duration.zero);
    expect(started, hashes.take(cap + 1));

    for (final hash in hashes) {
      if (pending[hash] != null && !pending[hash]!.isCompleted) {
        resolve(hash);
      }
    }
    await Future<void>.delayed(Duration.zero);
  });

  test('cancel drops a still-queued request before it is ever dispatched', () async {
    for (var i = 0; i < cap; i++) {
      unawaited(scheduler.decode('hold-$i', token: 'hold-$i'));
    }

    final result = scheduler.decode('cancel-me', token: 'cancel-me');
    expect(started, isNot(contains('cancel-me')), reason: 'every slot is already held, so this should be queued');

    scheduler.cancel('cancel-me');
    expect(await result, isNull);

    // Freeing every held slot afterwards must never dispatch the cancelled
    // request - it should have been removed from the queue entirely.
    for (var i = 0; i < cap; i++) {
      resolve('hold-$i');
    }
    await Future<void>.delayed(Duration.zero);
    expect(started, isNot(contains('cancel-me')));
  });

  test('cancel is a no-op once a request has already been dispatched', () async {
    final result = scheduler.decode('in-flight', token: 'in-flight');

    // Already dispatched (the cap wasn't reached) - must not be affected.
    scheduler.cancel('in-flight');

    resolve('in-flight');
    expect(await result, isNotNull);
  });

  test('overflow evicts the newest queued entry and always admits the new request', () async {
    for (var i = 0; i < cap; i++) {
      unawaited(scheduler.decode('hold-$i', token: 'hold-$i'));
    }

    // Fill the queue to exactly its depth limit.
    final queued = <int, Future<Map<String, int>?>>{};
    for (var i = 0; i < depth; i++) {
      queued[i] = scheduler.decode('queued-$i', token: i);
    }

    // One more arrives while already at the limit.
    final incoming = scheduler.decode('overflow', token: 'overflow');

    // The newest of the previously-queued batch (index depth - 1, the last
    // one added) is evicted rather than the incoming request.
    expect(await queued[depth - 1], isNull);

    for (var i = 0; i < cap; i++) {
      resolve('hold-$i');
    }
    await Future<void>.delayed(Duration.zero);

    // Drain the rest of the FIFO queue - resolving whatever's currently
    // dispatched-but-pending frees the next slot for whatever's next in
    // line - until the incoming ('overflow') request, now at the tail, gets
    // its own turn too.
    while (!started.contains('overflow')) {
      for (final hash in started.where((h) => !pending[h]!.isCompleted).toList()) {
        resolve(hash);
      }
      await Future<void>.delayed(Duration.zero);
    }
    resolve('overflow');

    // The oldest queued entry, closest to being dispatched, was resolved
    // normally along the way rather than evicted.
    expect(await queued[0], isNotNull);
    expect(await incoming, isNotNull);
  });

  test('propagates a native decode failure instead of silently swallowing it', () async {
    shouldFail.add('hash-fail');
    await expectLater(scheduler.decode('hash-fail', token: 'fail'), throwsA(isA<PlatformException>()));
  });
}
