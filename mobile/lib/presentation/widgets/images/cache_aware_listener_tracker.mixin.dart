import 'package:flutter/painting.dart';

/// Tracks listeners on an [ImageStreamCompleter] to safely cancel in-flight
/// network requests without interfering with [ImageCache] internals.
///
/// ### Problem
/// Cancelling fetches when the listener count drops to 1 (cache only) or 0
/// is unsafe due to three framework behaviours:
///
/// 1. **Memory-pressure eviction** — `ImageCache.clear()` removes the cache
///    listener while UI widgets still need the image. A count-based check
///    would cancel the active fetch, leaving the UI with no image.
/// 2. **Synchronous detach during `putIfAbsent`** — When an `initialImage`
///    is provided, the cache attaches, receives the frame, and detaches
///    synchronously *before* the UI widget can attach. Count reaches 0 and
///    would trigger a false cancel.
/// 3. **Listener misidentification** — After the cache detaches (via 1 or 2),
///    the next UI listener could be mistaken for the cache listener, causing
///    incorrect cancellations when that widget is disposed.
///
/// ### Solution: First-Listener Heuristic
/// The cache is always the first listener attached (via `putIfAbsent`). This
/// mixin records that identity once and uses it for all subsequent decisions:
///
/// * **Identity locking** — The first listener is assumed to be the cache.
///   Once identified, `_hasIdentifiedCacheListener` prevents reassignment.
/// * **Targeted cancellation** — Cancel only when the identified cache
///   listener is the sole remaining listener and no image has been delivered.
/// * **Sync-removal bypass** — When `hadInitialImage` is set, the first
///   synchronous removal of the cache listener is ignored so the fetch
///   survives until the UI attaches.
mixin CacheAwareListenerTrackerMixin on ImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  bool _hadInitialImage = false;
  bool _hasIgnoredFirstSyncRemoval = false;
  ImageStreamListener? _cacheListener;
  bool _hasIdentifiedCacheListener = false;

  /// Initializes the tracking state. Must be called in the subclass constructor.
  void setupListenerTracking({required bool hadInitialImage, void Function()? onLastListenerRemoved}) {
    _hadInitialImage = hadInitialImage;
    _onLastListenerRemoved = onLastListenerRemoved;
  }

  @override
  void addListener(ImageStreamListener listener) {
    if (!_hasIdentifiedCacheListener) {
      _hasIdentifiedCacheListener = true;
      _cacheListener = listener;
    }

    _listenerCount++;
    super.addListener(listener);
  }

  @override
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    _listenerCount--;

    final bool isCacheListener = listener == _cacheListener;
    if (isCacheListener) {
      _cacheListener = null;
    }

    if (_hadInitialImage && !_hasIgnoredFirstSyncRemoval && isCacheListener) {
      _hasIgnoredFirstSyncRemoval = true;
      return;
    }

    final bool onlyCacheListenerLeft = _listenerCount == 1 && _cacheListener != null;

    final bool completelyAbandoned = _listenerCount == 0;

    if (onlyCacheListenerLeft || completelyAbandoned) {
      final onLastListenerRemoved = _onLastListenerRemoved;
      if (onLastListenerRemoved != null) {
        _onLastListenerRemoved = null;
        onLastListenerRemoved();
      }
    }
  }
}
