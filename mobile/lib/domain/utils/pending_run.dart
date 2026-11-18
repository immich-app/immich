import 'dart:async';

class PendingRun<T> {
  final T Function(T pending, T requested) _merge;
  Completer<void>? _completer;
  late T _request;

  PendingRun({required this._merge});

  bool get isPending => _completer != null;

  Future<void> request(T request) {
    _request = isPending ? _merge(_request, request) : request;
    return (_completer ??= Completer<void>()).future;
  }

  void start(Future<void> Function(T request) run) {
    final completer = _completer;
    if (completer == null) {
      return;
    }
    _completer = null;
    completer.complete(run(_request));
  }

  void clear() {
    final completer = _completer;
    _completer = null;
    completer?.complete();
  }
}
