import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_data/store/util/slice.dart';
import 'package:riverpod/riverpod.dart';

class _TestCommands {
  final EventBus<int> bus;

  const _TestCommands(this.bus);
}

void main() {
  late ProviderContainer container;
  late Slice<_TestCommands, int, List<int>, String> slice;

  // The slice under test delegates to these per-test hooks
  late Future<List<int>> Function(String arg) onFetch;
  late List<int> Function(List<int> current, int event) onApply;

  void publish(int event) => container.read(slice.commands).bus.publish(event);

  setUp(() {
    onFetch = (_) async => [0];
    onApply = (current, event) => [...current, event];

    slice = Slice(
      commands: (ref, bus) => _TestCommands(bus),
      fetch: (ref, arg) => onFetch(arg),
      apply: (current, event, arg) => onApply(current, event),
    );
    container = ProviderContainer();
    addTearDown(container.dispose);
  });

  test('exposes the fetched value', () async {
    container.listen(slice.query('a'), (_, _) {});

    expect(await container.read(slice.query('a').future), [0]);
  });

  test('applies published events to the current state', () async {
    container.listen(slice.query('a'), (_, _) {});
    await container.read(slice.query('a').future);

    publish(1);
    publish(2);
    await pumpEventQueue();

    expect(container.read(slice.query('a')).requireValue, [0, 1, 2]);
  });

  test('every live argument receives each event', () async {
    onFetch = (arg) async => [arg.length];

    container.listen(slice.query('a'), (_, _) {});
    container.listen(slice.query('bb'), (_, _) {});
    await container.read(slice.query('a').future);
    await container.read(slice.query('bb').future);

    publish(9);
    await pumpEventQueue();

    expect(container.read(slice.query('a')).requireValue, [1, 9]);
    expect(container.read(slice.query('bb')).requireValue, [2, 9]);
  });

  test('an identical return from apply publishes no new state', () async {
    onApply = (current, _) => current;

    var notifications = 0;
    container.listen(slice.query('a'), (_, _) => notifications++);
    await container.read(slice.query('a').future);
    final settled = notifications;

    publish(1);
    await pumpEventQueue();

    expect(notifications, settled);
  });

  test('events arriving before the initial fetch completes are dropped', () async {
    final firstFetch = Completer<List<int>>();
    onFetch = (_) => firstFetch.future;

    container.listen(slice.query('a'), (_, _) {});
    await pumpEventQueue();

    publish(1);
    firstFetch.complete([0]);

    expect(await container.read(slice.query('a').future), [0]);
  });
}
