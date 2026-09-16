import 'dart:async';

import 'package:flutter/foundation.dart';

class _QueuedFetch {
  final Object token;
  final Future<Map<String, int>?> Function() start;
  final _completer = Completer<Map<String, int>?>();

  _QueuedFetch(this.token, this.start);
}

/// Coordinates outgoing remote image fetches (thumbnails, previews,
/// originals) across the whole app.
///
/// The native side (Cronet on Android) creates a brand-new HTTP request the
/// instant one is asked for, with no concurrency limit of its own - so
/// nothing stops the Dart side from firing dozens of requests a second, most
/// of which get cancelled again moments later, if something is scrolling
/// fast enough (e.g. a filmstrip's worth of thumbnails flying past during an
/// aggressive scrub). That fire-and-cancel-rapidly pattern has been observed
/// to crash the native HTTP engine outright (SIGSEGV inside libcronet), not
/// just waste bandwidth.
///
/// This caps how many fetches are in flight at once and queues the rest
/// FIFO, in request order, so they resolve as a smooth wave rather than
/// jumping around. A still-queued (not yet dispatched) request is dropped
/// the moment its caller cancels it - typically because whatever needed it
/// scrolled out of view before its turn came up - which avoids ever creating
/// a native request that's already irrelevant. A request that's already been
/// dispatched is the caller's own responsibility to cancel (e.g. via the
/// platform's cancelRequest), same as before this scheduler existed - and
/// since a dispatched request is deliberately *not* cancelled here to avoid
/// touching Cronet's own cancellation path under heavy churn, [_fetchTimeout]
/// is what guarantees its concurrency slot is eventually reclaimed even if
/// native code never reports back (a dead connection, a server that stops
/// responding mid-response) - without it, enough stuck requests would
/// permanently wedge every remote image load in the app.
class RemoteImageFetchScheduler {
  RemoteImageFetchScheduler._();

  static final instance = RemoteImageFetchScheduler._();

  static const _maxConcurrent = 6;
  static const _maxQueueDepth = 96;

  /// Frees a request's concurrency slot if native code hasn't reported back
  /// within this long, regardless of whether the underlying fetch is still
  /// running. Generous on purpose - this is a last-resort safety net, not a
  /// normal-path timeout, so it shouldn't fire for any request that's merely
  /// slow on a bad connection.
  static const _fetchTimeout = Duration(seconds: 20);

  /// Test-only: read-only visibility into the tuning constants above, so
  /// tests assert against the real values instead of duplicating them (and
  /// silently drifting out of sync if they're ever retuned).
  @visibleForTesting
  static int get maxConcurrentForTesting => _maxConcurrent;
  @visibleForTesting
  static int get maxQueueDepthForTesting => _maxQueueDepth;
  @visibleForTesting
  static Duration get fetchTimeoutForTesting => _fetchTimeout;

  var _inFlight = 0;
  final _queue = <_QueuedFetch>[];

  /// Runs [start] once a concurrency slot is free, resolving to its result -
  /// or null if this request was dropped (queue overflow, or [cancel] was
  /// called before it was dispatched).
  Future<Map<String, int>?> schedule(Object token, Future<Map<String, int>?> Function() start) {
    if (_queue.length >= _maxQueueDepth) {
      // Evict the newest still-queued entry, not the oldest: the oldest is
      // closest to being dispatched (FIFO) and most likely still relevant,
      // while the newest has waited the least and is cheapest to give up on.
      // This request is always admitted rather than being the one dropped.
      _queue.removeLast().complete(null);
    }
    final request = _QueuedFetch(token, start);
    _queue.add(request);
    _pump();
    return request._completer.future;
  }

  /// Drops the queued request identified by [token] if it hasn't been
  /// dispatched yet. A no-op if it's already in flight or completed.
  void cancel(Object token) {
    for (final request in _queue) {
      if (identical(request.token, token)) {
        request.complete(null);
        return;
      }
    }
  }

  /// Test-only: clears queued and in-flight bookkeeping between tests, since
  /// [instance] is a singleton and would otherwise carry state from one test
  /// into the next. Anything still queued resolves to null, as if dropped.
  /// This can't reach in-flight requests - already-dispatched native calls
  /// keep running regardless (see the class doc on why) - so call this
  /// between tests, once everything from the previous one has settled,
  /// rather than expecting it to sweep away work still in progress.
  @visibleForTesting
  void reset() {
    for (final request in _queue) {
      request.complete(null);
    }
    _queue.clear();
    _inFlight = 0;
  }

  void _pump() {
    while (_inFlight < _maxConcurrent && _queue.isNotEmpty) {
      final next = _queue.removeAt(0);
      if (next.isCompleted) {
        continue;
      }
      _inFlight++;
      unawaited(
        _run(next.start)
            .timeout(_fetchTimeout, onTimeout: () => null)
            .then(next.complete, onError: (Object e, StackTrace st) => next.completeError(e, st))
            .whenComplete(() {
              _inFlight--;
              _pump();
            }),
      );
    }
  }

  // Re-wraps start()'s result through a function whose *declared* return
  // type is explicitly nullable, so the Future .timeout() below operates on
  // is guaranteed to be reified as Future<Map<String, int>?> at runtime -
  // regardless of what the caller's own closure happens to infer (e.g. one
  // with no null-returning path reifies as the narrower Future<Map<String,
  // int>>). .timeout()'s onTimeout callback is type-checked against that
  // runtime type, not the static field type, so without this a caller whose
  // closure can't itself return null would crash here instead of timing out.
  static Future<Map<String, int>?> _run(Future<Map<String, int>?> Function() start) async => start();
}

extension on _QueuedFetch {
  bool get isCompleted => _completer.isCompleted;

  void complete(Map<String, int>? value) {
    if (!_completer.isCompleted) {
      _completer.complete(value);
    }
  }

  void completeError(Object error, StackTrace stackTrace) {
    if (!_completer.isCompleted) {
      _completer.completeError(error, stackTrace);
    }
  }
}
