import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/utils/pending_run.dart';

void main() {
  late PendingRun<bool> pending;
  late List<bool> runs;

  Future<void> run(bool full) async => runs.add(full);

  setUp(() {
    pending = PendingRun<bool>(merge: (pending, requested) => pending || requested);
    runs = [];
  });

  test('start does nothing without a request', () {
    pending.start(run);

    expect(runs, isEmpty);
    expect(pending.isPending, isFalse);
  });

  test('requests collapse into a single run', () async {
    final first = pending.request(false);
    final second = pending.request(false);
    pending.start(run);
    await Future.wait([first, second]);

    expect(runs, [false]);
    expect(pending.isPending, isFalse);
  });

  test('a full request is kept when merged with others', () async {
    final requests = [pending.request(false), pending.request(true), pending.request(false)];
    pending.start(run);
    await Future.wait(requests);

    expect(runs, [true]);
  });

  test('requests complete only once the run they started is done', () async {
    final blocker = Completer<void>();
    var completed = false;
    unawaited(pending.request(false).then((_) => completed = true));
    pending.start((_) => blocker.future);
    await pumpEventQueue();
    expect(completed, isFalse);

    blocker.complete();
    await pumpEventQueue();
    expect(completed, isTrue);
  });

  test('a request after start waits for the next start', () async {
    final first = pending.request(true);
    pending.start(run);
    await first;

    unawaited(pending.request(false));
    expect(pending.isPending, isTrue);

    pending.start(run);
    expect(runs, [true, false]);
  });

  test('clear completes pending requests without a run', () async {
    final request = pending.request(true);
    pending.clear();
    await request;
    pending.start(run);

    expect(runs, isEmpty);
    expect(pending.isPending, isFalse);
  });

  test('a void run collapses requests', () async {
    final hash = PendingRun<void>(merge: (_, _) {});
    var count = 0;
    final requests = [hash.request(null), hash.request(null)];
    hash.start((_) async => count++);
    await Future.wait(requests);

    expect(count, 1);
  });
}
