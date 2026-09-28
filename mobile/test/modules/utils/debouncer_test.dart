import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/debounce.dart';

class _Counter {
  int _count = 0;
  _Counter();

  int get count => _count;
  void increment() => _count = _count + 1;
}

void main() {
  test('Executes the method after the interval', () async {
    final counter = _Counter();
    final debouncer = Debouncer(interval: const Duration(milliseconds: 300));
    debouncer.run(() => counter.increment());
    expect(counter.count, 0);
    await Future.delayed(const Duration(milliseconds: 300));
    expect(counter.count, 1);
  });

  test('Executes the method immediately if zero interval', () async {
    final counter = _Counter();
    final debouncer = Debouncer(interval: Duration.zero);
    debouncer.run(() => counter.increment());
    // Even though it is supposed to be executed immediately, it is added to the async queue and so
    // we need this delay to make sure the actual debounced method is called
    await Future.delayed(Duration.zero);
    expect(counter.count, 1);
  });

  test('Delayes method execution after all the calls are completed', () async {
    final counter = _Counter();
    final debouncer = Debouncer(interval: const Duration(milliseconds: 100));
    debouncer.run(() => counter.increment());
    debouncer.run(() => counter.increment());
    debouncer.run(() => counter.increment());
    await Future.delayed(const Duration(milliseconds: 300));
    expect(counter.count, 1);
  });
}
