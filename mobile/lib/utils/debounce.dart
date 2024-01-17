import 'dart:async';

import 'package:flutter_hooks/flutter_hooks.dart';

/// Used to debounce function calls with the [interval] provided.
class Debouncer {
  Debouncer({required this.interval});
  final Duration interval;
  Timer? _timer;
  FutureOr<void> Function()? _lastAction;

  void run(FutureOr<void> Function() action) {
    _lastAction = action;
    _timer?.cancel();
    _timer = Timer(interval, _callAndRest);
  }

  void _callAndRest() {
    _lastAction?.call();
    _timer = null;
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
    _lastAction = null;
  }
}

/// Creates a [Debouncer] that will be disposed automatically. If no [interval] is provided, a
/// default interval of 300ms is used to debounce the function calls
Debouncer useDebouncer({
  Duration interval = const Duration(milliseconds: 300),
  List<Object?>? keys,
}) =>
    use(_DebouncerHook(interval: interval, keys: keys));

class _DebouncerHook extends Hook<Debouncer> {
  const _DebouncerHook({
    required this.interval,
    List<Object?>? keys,
  }) : super(keys: keys);

  final Duration interval;

  @override
  HookState<Debouncer, Hook<Debouncer>> createState() => _DebouncerHookState();
}

class _DebouncerHookState extends HookState<Debouncer, _DebouncerHook> {
  late final debouncer = Debouncer(interval: hook.interval);

  @override
  Debouncer build(_) => debouncer;

  @override
  void dispose() => debouncer.dispose();

  @override
  String get debugLabel => 'useDebouncer';
}
