import 'dart:async';

import 'package:riverpod/riverpod.dart';

/// A broadcast channel for a single store [Slice]'s mutation events
class EventBus<E> {
  final _controller = StreamController<E>.broadcast(sync: true);

  /// Send [event] to all current listeners
  void publish(E event) => _controller.add(event);

  Stream<E> get _stream => _controller.stream;

  Future<void> dispose() => _controller.close();
}

/// The read notifier for one read scope (i.e. `getAll()`) of a [Slice]. Fetches once on build, then applies received mutation events and rebroadcasts them to Riverpod
class SliceNotifier<T, E, Arg> extends AutoDisposeFamilyAsyncNotifier<T, Arg> {
  late final Provider<EventBus<E>> _bus;
  late final Future<T> Function(Ref<AsyncValue<T>> ref, Arg arg) _fetch;
  late final T Function(T current, E event, Arg arg) _apply;

  @override
  Future<T> build(Arg arg) {
    // On first build, run `_fetch` function to receive initial state
    // Subscribe to event stream to keep our state current
    final subscription = ref.watch(_bus)._stream.listen((event) {
      final current = state.valueOrNull;
      if (current == null) {
        return;
      }

      final result = _apply(current, event, arg);
      if (!identical(result, current)) {
        state = AsyncData(result);
      }
    });
    ref.onDispose(subscription.cancel);

    return _fetch(ref, arg);
  }
}

/// The provider of one read [Slice] scope, returned by the slice's named read accessors (`getAll()`)
typedef SliceQuery<T, E, Arg> = AutoDisposeFamilyAsyncNotifierProvider<SliceNotifier<T, E, Arg>, T, Arg>;

/// Constructs a set of [Provider]'s mapping to commands and data subscriptions of the same in-memory store
///
/// - [commands] - A function projecting a command [Provider]. The methods exposed by this provider will be mapped to be top level methods on [this] (`ref.watch(Store.x).doMutation()`)
/// - [fetch] - A function that provides initial state for all data subscriptions within this [Provider]
/// - [apply] - A function that applies events to the current in-memory store value. Identity must be preserved if no changes/updates are intended
class Slice<S, E, T, Arg> {
  Slice({
    required S Function(Ref<S> ref, EventBus<E> bus) commands,
    required Future<T> Function(Ref<AsyncValue<T>> ref, Arg arg) fetch,
    required T Function(T current, E event, Arg arg) apply,
  }) {
    // The bus's lifetime is tied to the owning ProviderContainer
    final bus = Provider<EventBus<E>>((ref) {
      final bus = EventBus<E>();
      ref.onDispose(() => unawaited(bus.dispose()));
      return bus;
    });

    this.commands = Provider<S>((ref) => commands(ref, ref.watch(bus)));
    query = AsyncNotifierProvider.autoDispose.family<SliceNotifier<T, E, Arg>, T, Arg>(
      () => SliceNotifier<T, E, Arg>()
        .._bus = bus
        .._fetch = fetch
        .._apply = apply,
    );
  }

  /// The slice's command [Provider]
  late final Provider<S> commands;

  /// The slice's scoped read providers
  late final AutoDisposeAsyncNotifierProviderFamily<SliceNotifier<T, E, Arg>, T, Arg> query;
}
