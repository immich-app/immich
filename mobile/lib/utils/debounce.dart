import 'dart:async';

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
        (_lastActionTime == null || DateTime.now().difference(_lastActionTime!) > maxWaitTime!)) {
      _callAndRest();
      return;
    }
    _timer = Timer(interval, _callAndRest);
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

  // ignore: unused-code
  bool get isActive => _actionFuture != null || (_timer != null && _timer!.isActive);
}
