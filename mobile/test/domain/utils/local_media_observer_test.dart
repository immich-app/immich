import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/utils/local_media_observer.dart';

void main() {
  late StreamController<void> changes;
  late int listenCount;
  late int runCount;
  late Completer<void>? blockRun;
  late bool Function() isCancelled;
  late LocalMediaObserver observer;

  setUp(() {
    listenCount = 0;
    runCount = 0;
    blockRun = null;
    changes = StreamController<void>.broadcast(onListen: () => listenCount++);
    observer = LocalMediaObserver(
      changes: () => changes.stream,
      onChange: (cancelled) async {
        isCancelled = cancelled;
        runCount++;
        await blockRun?.future;
      },
    );
  });

  tearDown(() => changes.close());

  test('a change runs right away', () {
    fakeAsync((async) {
      observer.start();
      changes.add(null);
      async.flushMicrotasks();

      expect(runCount, 1);
    });
  });

  test('changes during a run trigger exactly one more run after the cooldown', () {
    fakeAsync((async) {
      blockRun = Completer<void>();
      observer.start();
      changes.add(null);
      async.flushMicrotasks();
      expect(runCount, 1);

      changes.add(null);
      changes.add(null);
      async.elapse(const Duration(seconds: 2));
      expect(runCount, 1);

      blockRun!.complete();
      blockRun = null;
      async.elapse(const Duration(milliseconds: 499));
      expect(runCount, 1);

      async.elapse(const Duration(milliseconds: 1));
      expect(runCount, 2);

      async.elapse(const Duration(seconds: 2));
      expect(runCount, 2);
    });
  });

  test('a change within the cooldown runs once the cooldown ends', () {
    fakeAsync((async) {
      observer.start();
      changes.add(null);
      async.elapse(const Duration(milliseconds: 100));
      changes.add(null);
      async.elapse(const Duration(milliseconds: 399));
      expect(runCount, 1);

      async.elapse(const Duration(milliseconds: 1));
      expect(runCount, 2);
    });
  });

  test('a change after the cooldown runs right away', () {
    fakeAsync((async) {
      observer.start();
      changes.add(null);
      async.elapse(const Duration(milliseconds: 500));
      changes.add(null);
      async.flushMicrotasks();

      expect(runCount, 2);
    });
  });

  test('a continuous burst runs at most once per cooldown', () {
    fakeAsync((async) {
      observer.start();
      for (var i = 0; i < 20; i++) {
        changes.add(null);
        async.elapse(const Duration(milliseconds: 100));
      }

      // Runs at 0, 0.5, 1, 1.5 and 2 seconds
      expect(runCount, 5);
    });
  });

  test('a failing run does not stop observing', () {
    fakeAsync((async) {
      final failing = LocalMediaObserver(
        changes: () => changes.stream,
        onChange: (_) async {
          runCount++;
          throw Exception('sync failed');
        },
      );
      failing.start();
      changes.add(null);
      async.elapse(const Duration(seconds: 1));
      changes.add(null);
      async.flushMicrotasks();

      expect(runCount, 2);
    });
  });

  test('stop drops a pending run and stops listening', () {
    fakeAsync((async) {
      observer.start();
      changes.add(null);
      async.flushMicrotasks();
      changes.add(null);
      async.flushMicrotasks();
      unawaited(observer.stop());
      async.elapse(const Duration(seconds: 10));
      changes.add(null);
      async.elapse(const Duration(seconds: 10));

      expect(runCount, 1);
      expect(observer.isObserving, isFalse);
      expect(changes.hasListener, isFalse);
    });
  });

  test('a run stopped mid-way stays cancelled after a restart', () {
    fakeAsync((async) {
      blockRun = Completer<void>();
      observer.start();
      changes.add(null);
      async.flushMicrotasks();
      final stoppedRun = isCancelled;
      expect(stoppedRun(), isFalse);

      unawaited(observer.stop());
      observer.start();
      async.flushMicrotasks();
      expect(stoppedRun(), isTrue);

      blockRun!.complete();
      blockRun = null;
      async.elapse(const Duration(seconds: 1));
      changes.add(null);
      async.flushMicrotasks();

      expect(runCount, 2);
      expect(isCancelled(), isFalse);
    });
  });

  test('start is idempotent', () {
    observer.start();
    observer.start();

    expect(listenCount, 1);
  });
}
