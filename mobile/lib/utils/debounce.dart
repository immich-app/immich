import 'dart:async';

import 'package:flutter_hooks/flutter_hooks.dart';

/// Used to debounce function calls with the [interval] provided.
/// If [maxWaitTime] is provided, the first [run] call as well as the next call since [maxWaitTime] has passed will be immediately executed, even if [interval] is not satisfied.
class Debouncer {
  Debouncer({required this.interval, this.maxWaitTime});
  final Duration interval;
  final Duration? maxWaitTime;
  Timer? _timer;
  FutureOr<void> Function()? _lastAction;
  DateTime? _lastActionTime;
  Future<void>? _actionFuture;

  void run(FutureOr<void> Function() action) {
    _lastAction = action;
    _timer?.cancel();

    if (maxWaitTime != null &&
        // _actionFuture == null && // TODO: should this check be here?
        (_lastActionTime == null ||
            DateTime.now().difference(_lastActionTime!) > maxWaitTime!)) {
      _callAndRest();
      return;
    }
    _timer = Timer(interval, _callAndRest);
  }

  Future<void>? drain() {
    if (_timer != null && _timer!.isActive) {
      _timer!.cancel();
      if (_lastAction != null) {
        _callAndRest();
      }
    }
    return _actionFuture;
  }

  @pragma('vm:prefer-inline')
  void _callAndRest() {
    _lastActionTime = DateTime.now();
    final action = _lastAction;
    _lastAction = null;

    final result = action!();
    if (result is Future) {
      _actionFuture = result.whenComplete(() {
        _actionFuture = null;
      });
    }
    _timer = null;
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
    _lastAction = null;
    _lastActionTime = null;
    _actionFuture = null;
  }

  bool get isActive =>
      _actionFuture != null || (_timer != null && _timer!.isActive);
}

/// Creates a [Debouncer] that will be disposed automatically. If no [interval] is provided, a
/// default interval of 300ms is used to debounce the function calls
Debouncer useDebouncer({
  Duration interval = const Duration(milliseconds: 300),
  Duration? maxWaitTime,
  List<Object?>? keys,
}) =>
    use(
      _DebouncerHook(
        interval: interval,
        maxWaitTime: maxWaitTime,
        keys: keys,
      ),
    );

class _DebouncerHook extends Hook<Debouncer> {
  const _DebouncerHook({
    required this.interval,
    this.maxWaitTime,
    super.keys,
  });

  final Duration interval;
  final Duration? maxWaitTime;

  @override
  HookState<Debouncer, Hook<Debouncer>> createState() => _DebouncerHookState();
}

class _DebouncerHookState extends HookState<Debouncer, _DebouncerHook> {
  late final debouncer = Debouncer(
    interval: hook.interval,
    maxWaitTime: hook.maxWaitTime,
  );

  @override
  Debouncer build(_) => debouncer;

  @override
  void dispose() => debouncer.dispose();

  @override
  String get debugLabel => 'useDebouncer';
}
