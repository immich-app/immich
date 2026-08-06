import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_data/store/util/stream_cache.dart';

void main() {
  late int fetches;
  late StreamCache<String, List<String>> cache;

  setUp(() {
    fetches = 0;
    cache = StreamCache(fetch: (key) async => ['$key-v${++fetches}']);
    addTearDown(cache.dispose);
  });

  /// Subscribes and collects every emission
  List<List<String>> subscribe(String key, {bool force = false}) {
    final emissions = <List<String>>[];
    final subscription = cache.get(key, force: force).listen(emissions.add);
    addTearDown(subscription.cancel);
    return emissions;
  }

  test('fetches and emits on first subscribe', () async {
    await expectLater(cache.get('a'), emits(['a-v1']));
  });

  test('a second subscriber is served from the cache without a fetch', () async {
    subscribe('a');
    await pumpEventQueue();

    await expectLater(cache.get('a'), emits(['a-v1']));

    expect(fetches, 1);
  });

  test('force skips the cached emission and always fetches', () async {
    subscribe('a');
    await pumpEventQueue();

    await expectLater(cache.get('a', force: true), emits(['a-v2']));

    expect(fetches, 2);
  });

  test('keys are cached independently', () async {
    await expectLater(cache.get('a'), emits(['a-v1']));
    await expectLater(cache.get('b'), emits(['b-v2']));
  });

  test('concurrent first subscribers share a single fetch', () async {
    final completer = Completer<List<String>>();
    cache = StreamCache(
      fetch: (key) {
        fetches++;
        return completer.future;
      },
    );
    addTearDown(cache.dispose);
    final first = subscribe('a');
    final second = subscribe('a');

    completer.complete(['shared']);
    await pumpEventQueue();

    expect(first, [
      ['shared'],
    ]);
    expect(first, second);
    expect(fetches, 1);
  });

  test('a failed fetch is a stream error and the stream survives', () async {
    var fail = true;
    cache = StreamCache(fetch: (key) => fail ? Future.error(StateError('down')) : Future.value(['recovered']));
    addTearDown(cache.dispose);

    final events = <Object>[];
    final subscription = cache.get('a').listen(events.add, onError: (Object error) => events.add('error'));
    addTearDown(subscription.cancel);
    await pumpEventQueue();
    expect(events, ['error']);

    fail = false;
    subscribe('a', force: true);
    await pumpEventQueue();

    expect(events, [
      'error',
      ['recovered'],
    ]);
  });

  test('the cache is dropped when the last subscriber cancels', () async {
    final subscription = cache.get('a').listen((_) {});
    await pumpEventQueue();
    await subscription.cancel();

    await expectLater(cache.get('a'), emits(['a-v2']));

    expect(fetches, 2);
  });

  group('update', () {
    test('transforms and publishes every matching cached value', () async {
      final a = subscribe('a');
      final b = subscribe('b');
      final c = subscribe('c');
      await pumpEventQueue();

      cache.update((key) => key != 'c', (value) => [...value, 'patched']);
      await pumpEventQueue();

      expect(a.last, ['a-v1', 'patched']);
      expect(b.last, ['b-v2', 'patched']);
      expect(c.last, ['c-v3']);
    });

    test('publishes nothing when the transform returns the identical value', () async {
      final a = subscribe('a');
      await pumpEventQueue();

      cache.update((_) => true, (value) => value);
      await pumpEventQueue();

      expect(a, hasLength(1));
    });

    test('does not touch keys that have no cached value yet', () {
      cache.update((_) => true, (value) => [...value, 'patched']);
      // No cached values exist; nothing to transform and nothing thrown.
      expect(fetches, 0);
    });
  });

  test('dispose ends every subscriber stream', () async {
    var done = false;
    final subscription = cache.get('a').listen((_) {});
    subscription.onDone(() => done = true);
    addTearDown(subscription.cancel);
    await pumpEventQueue();

    await cache.dispose();
    await pumpEventQueue();

    expect(done, isTrue);
  });
}
