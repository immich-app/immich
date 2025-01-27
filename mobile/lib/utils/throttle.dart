import 'package:flutter_hooks/flutter_hooks.dart';

/// Throttles function calls with the [interval] provided.
/// Also make sures to call the last Action after the elapsed interval
class Throttler {
  final Duration interval;
  DateTime? _lastActionTime;

  Throttler({required this.interval});

  T? run<T>(T Function() action) {
    if (_lastActionTime == null ||
        (DateTime.now().difference(_lastActionTime!) > interval)) {
      final response = action();
      _lastActionTime = DateTime.now();
      return response;
    }

    return null;
  }

  void dispose() {
    _lastActionTime = null;
  }
}

/// Creates a [Throttler] that will be disposed automatically. If no [interval] is provided, a
/// default interval of 300ms is used to throttle the function calls
Throttler useThrottler({
  Duration interval = const Duration(milliseconds: 300),
  List<Object?>? keys,
}) =>
    use(_ThrottleHook(interval: interval, keys: keys));

class _ThrottleHook extends Hook<Throttler> {
  const _ThrottleHook({
    required this.interval,
    super.keys,
  });

  final Duration interval;

  @override
  HookState<Throttler, Hook<Throttler>> createState() => _ThrottlerHookState();
}

class _ThrottlerHookState extends HookState<Throttler, _ThrottleHook> {
  late final throttler = Throttler(interval: hook.interval);

  @override
  Throttler build(_) => throttler;

  @override
  void dispose() => throttler.dispose();

  @override
  String get debugLabel => 'useThrottler';
}
