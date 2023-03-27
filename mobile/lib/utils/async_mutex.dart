import 'dart:async';

/// Async mutex to guarantee actions are performed sequentially and do not interleave
class AsyncMutex {
  Future _running = Future.value(null);
  int _enqueued = 0;

  get enqueued => _enqueued;

  /// Execute [operation] exclusively, after any currently running operations.
  /// Returns a [Future] with the result of the [operation].
  Future<T> run<T>(Future<T> Function() operation) {
    final completer = Completer<T>();
    _enqueued++;
    _running.whenComplete(() {
      _enqueued--;
      completer.complete(Future<T>.sync(operation));
    });
    return _running = completer.future;
  }
}
