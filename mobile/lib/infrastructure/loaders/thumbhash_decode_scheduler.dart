import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

class _QueuedThumbhashDecode {
  final String thumbhash;
  final Object token;
  final _completer = Completer<Map<String, int>?>();

  _QueuedThumbhashDecode(this.thumbhash, this.token);
}

/// Coordinates thumbhash decode requests across the whole app.
///
/// Each request is a platform-channel round trip to native code that, once
/// dispatched, cannot be cancelled - so firing one per thumbnail as they fly
/// past during a fast scroll/scrub floods the native decode thread pool with
/// requests for cells that may already be off-screen by the time they'd
/// complete, causing a visible backlog to work through afterwards.
///
/// This scheduler caps how many decodes are in flight at once and queues the
/// rest FIFO, in the order thumbnails actually scrolled into view - so they
/// resolve as a smooth, predictable wave matching scroll direction, rather
/// than jumping around. A queued (not yet dispatched) request is dropped the
/// moment its caller tells us - via [cancel] - that it's no longer needed,
/// e.g. because the thumbnail scrolled back out of view before its turn came
/// up; that's a precise, immediate signal, unlike a queue-depth heuristic,
/// and it means reversing direction doesn't leave a hole where a thumbnail
/// you just saw should be - anything you can still see was requested only
/// moments ago and is still near the front of the line. [_maxQueueDepth]
/// exists only as a last-resort safety net against unbounded growth.
class ThumbHashDecodeScheduler {
  ThumbHashDecodeScheduler._();

  static final instance = ThumbHashDecodeScheduler._();

  static const _maxConcurrent = 4;
  static const _maxQueueDepth = 96;

  /// Test-only: read-only visibility into the tuning constants above, so
  /// tests assert against the real values instead of duplicating them (and
  /// silently drifting out of sync if they're ever retuned).
  @visibleForTesting
  static int get maxConcurrentForTesting => _maxConcurrent;
  @visibleForTesting
  static int get maxQueueDepthForTesting => _maxQueueDepth;

  var _inFlight = 0;
  final _queue = <_QueuedThumbhashDecode>[];

  /// Resolves to the decoded thumbhash info, or null if this request was
  /// cancelled or dropped before it could be dispatched. [token] identifies
  /// the caller so a later [cancel] call can find and drop this specific
  /// request while it's still queued.
  Future<Map<String, int>?> decode(String thumbhash, {required Object token}) {
    if (_queue.length >= _maxQueueDepth) {
      // Evict the newest still-queued entry, not the oldest: the oldest is
      // closest to being dispatched (FIFO) and most likely still relevant,
      // while the newest has waited the least and is cheapest to give up on.
      // This request is always admitted rather than being the one dropped.
      _queue.removeLast().complete(null);
    }
    final request = _QueuedThumbhashDecode(thumbhash, token);
    _queue.add(request);
    _pump();
    return request._completer.future;
  }

  /// Drops the queued request identified by [token], if it hasn't already
  /// been dispatched to native code (in which case it can't be cancelled and
  /// is left to complete and be ignored).
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
      // Oldest/earliest-requested first, matching the order thumbnails
      // actually scrolled into view.
      final next = _queue.removeAt(0);
      if (next.isCompleted) {
        continue;
      }
      _inFlight++;
      unawaited(
        localImageApi
            .getThumbhash(next.thumbhash)
            .then(next.complete, onError: (Object e, StackTrace st) => next.completeError(e, st))
            .whenComplete(() {
              _inFlight--;
              _pump();
            }),
      );
    }
  }
}

extension on _QueuedThumbhashDecode {
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
