import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/loaders/remote_image_fetch_scheduler.dart';

void main() {
  final scheduler = RemoteImageFetchScheduler.instance;
  final cap = RemoteImageFetchScheduler.maxConcurrentForTesting;
  final depth = RemoteImageFetchScheduler.maxQueueDepthForTesting;

  // instance is a process-lifetime singleton, so every test starts from a
  // known-empty queue/in-flight count rather than inheriting state left
  // behind by whichever test ran before it.
  setUp(() => scheduler.reset());

  test('runs a request immediately when under the concurrency cap', () async {
    var started = false;
    final result = await scheduler.schedule('a', () async {
      started = true;
      return {'pointer': 1};
    });

    expect(started, isTrue);
    expect(result, {'pointer': 1});
  });

  test('queues requests beyond the cap and dispatches the oldest queued one next', () async {
    final started = <int>[];
    final completers = List.generate(cap + 5, (_) => Completer<Map<String, int>?>());

    for (var i = 0; i < completers.length; i++) {
      unawaited(
        scheduler.schedule(i, () async {
          started.add(i);
          return completers[i].future;
        }),
      );
    }

    // Only the first `cap` are dispatched yet, in the order they arrived.
    expect(started, List.generate(cap, (i) => i));

    // Completing one frees a slot for the oldest still-queued request (index
    // `cap`), not an arbitrary one.
    completers[0].complete(null);
    await Future<void>.delayed(Duration.zero);
    expect(started, List.generate(cap + 1, (i) => i));

    for (final completer in completers) {
      if (!completer.isCompleted) {
        completer.complete(null);
      }
    }
    await Future<void>.delayed(Duration.zero);
  });

  test('cancel drops a still-queued request before it is ever dispatched', () async {
    final holdOpen = List.generate(cap, (_) => Completer<Map<String, int>?>());
    for (var i = 0; i < cap; i++) {
      unawaited(scheduler.schedule('hold-$i', () => holdOpen[i].future));
    }

    var started = false;
    final result = scheduler.schedule('cancel-me', () async {
      started = true;
      return {'pointer': 1};
    });
    expect(started, isFalse, reason: 'every slot is already held, so this should still be queued');

    scheduler.cancel('cancel-me');
    expect(await result, isNull);

    // Freeing every held slot afterwards must never dispatch the cancelled
    // request - it should have been removed from the queue entirely.
    for (final completer in holdOpen) {
      completer.complete(null);
    }
    await Future<void>.delayed(Duration.zero);
    expect(started, isFalse);
  });

  test('cancel is a no-op once a request has already been dispatched', () async {
    final completer = Completer<Map<String, int>?>();
    final result = scheduler.schedule('in-flight', () => completer.future);

    // Already dispatched (the cap wasn't reached) - must not be affected.
    scheduler.cancel('in-flight');

    completer.complete({'pointer': 42});
    expect(await result, {'pointer': 42});
  });

  test('overflow evicts the newest queued entry and always admits the new request', () async {
    final holdOpen = List.generate(cap, (_) => Completer<Map<String, int>?>());
    for (var i = 0; i < cap; i++) {
      unawaited(scheduler.schedule('hold-$i', () => holdOpen[i].future));
    }

    // Fill the queue to exactly its depth limit.
    final queued = <int, Future<Map<String, int>?>>{};
    for (var i = 0; i < depth; i++) {
      queued[i] = scheduler.schedule(i, () async => {'pointer': i});
    }

    // One more arrives while already at the limit.
    final incoming = scheduler.schedule('overflow', () async => {'pointer': -1});

    // The incoming request is admitted rather than being the one dropped...
    // ...and the newest of the previously-queued batch (index depth - 1,
    // the last one added) is evicted instead of the oldest.
    expect(await queued[depth - 1], isNull);

    for (final completer in holdOpen) {
      completer.complete(null);
    }
    await Future<void>.delayed(Duration.zero);

    // The oldest queued entries, closest to being dispatched, were untouched.
    expect(await queued[0], {'pointer': 0});
    expect(await incoming, {'pointer': -1});
  });

  test('a request that never reports back frees its slot via the timeout, not native cancellation', () {
    fakeAsync((async) {
      Map<String, int>? result;
      var resolved = false;
      unawaited(
        scheduler.schedule('stuck', () => Completer<Map<String, int>?>().future).then((value) {
          result = value;
          resolved = true;
        }),
      );

      async.elapse(RemoteImageFetchScheduler.fetchTimeoutForTesting + const Duration(seconds: 1));

      expect(resolved, isTrue);
      expect(result, isNull);
    });
  });
}
