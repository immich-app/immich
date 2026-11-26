import 'dart:async';

import 'package:logging/logging.dart';

class _RunToken {
  bool cancelled = false;
}

class LocalMediaObserver {
  final Stream<void> Function() _changes;

  /// [isCancelled] turns true once [stop] is called, even if the observer is started again.
  /// Check it between steps so a run that outlived a pause or logout does no more work.
  final Future<void> Function(bool Function() isCancelled) _onChange;
  final Duration cooldown;

  final _log = Logger("LocalMediaObserver");

  StreamSubscription<void>? _subscription;
  Timer? _cooldownTimer;
  _RunToken? _currentRun;
  bool _isRunning = false;
  bool _rerun = false;

  LocalMediaObserver({
    required this._changes,
    required this._onChange,
    this.cooldown = const Duration(milliseconds: 500),
  });

  bool get isObserving => _subscription != null;

  void start() {
    _subscription ??= _changes().listen(
      (_) => _handleChange(),
      onError: (e, s) => _log.warning("Change stream failed", e, s),
    );
  }

  Future<void> stop() async {
    _currentRun?.cancelled = true;
    _currentRun = null;
    _cooldownTimer?.cancel();
    _cooldownTimer = null;
    _rerun = false;
    final cancelled = _subscription?.cancel();
    _subscription = null;
    await cancelled;
  }

  void _handleChange() {
    if (_isRunning || _cooldownTimer != null) {
      _rerun = true;
      return;
    }
    unawaited(_run());
  }

  Future<void> _run() async {
    _isRunning = true;
    _rerun = false;
    _log.info("Media library changed, processing changes");
    final run = _currentRun = _RunToken();
    try {
      await _onChange(() => run.cancelled);
    } catch (e, s) {
      _log.warning("Failed to process media changes", e, s);
    } finally {
      _isRunning = false;
      if (identical(_currentRun, run)) {
        _currentRun = null;
      }
    }

    if (!isObserving) {
      return;
    }
    _cooldownTimer = Timer(cooldown, () {
      _cooldownTimer = null;
      if (_rerun && isObserving) {
        unawaited(_run());
      }
    });
  }
}
