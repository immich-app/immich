import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/throttle.dart';

class _Counter {
  int _count = 0;
  _Counter();

  int get count => _count;
  void increment() {
    debugPrint("Counter inside increment: $count");
    _count = _count + 1;
  }
}

void main() {
  test('Executes the method immediately if no calls received previously',
      () async {
    var counter = _Counter();
    final throttler = Throttler(interval: const Duration(milliseconds: 300));
    throttler.run(() => counter.increment());
    expect(counter.count, 1);
  });

  test('Does not execute calls before throttle interval', () async {
    var counter = _Counter();
    final throttler = Throttler(interval: const Duration(milliseconds: 100));
    throttler.run(() => counter.increment());
    throttler.run(() => counter.increment());
    throttler.run(() => counter.increment());
    throttler.run(() => counter.increment());
    throttler.run(() => counter.increment());
    await Future.delayed(const Duration(seconds: 1));
    expect(counter.count, 1);
  });

  test('Executes the method if received in intervals', () async {
    var counter = _Counter();
    final throttler = Throttler(interval: const Duration(milliseconds: 100));
    for (final _ in Iterable<int>.generate(10)) {
      throttler.run(() => counter.increment());
      await Future.delayed(const Duration(milliseconds: 50));
    }
    await Future.delayed(const Duration(seconds: 1));
    expect(counter.count, 5);
  });
}
