import 'dart:async';

/// A in memory cache for streams that are backed by emphemeral data (typically HTTP servers).
/// Values are fetched on demand and disposed of when the last subscriber disconnects
class StreamCache<K, V extends Object> {
  final Future<V> Function(K key) _fetch;

  final Map<K, _CacheEntry<V>> _entries = {};
  final Map<K, Future<void>> _inflightFetches = {};

  StreamCache({required this._fetch});

  /// A live view of the value corresponding to [key]. [force] skips the cached emission and always fetches
  // TODO(rewrite): Remove force; it exists only for old Flutter views that expect 0 data on first subscribe
  Stream<V> get(K key, {bool force = false}) {
    // Reprents this call's subscription
    late final StreamController<V> localStreamController;
    // Reprents the source of all updates for this key, shared between individual `get` callers
    StreamSubscription<V>? cacheStreamController;

    localStreamController = StreamController(
      onListen: () {
        final entry = _entries.putIfAbsent(key, _CacheEntry.new).ref();

        // Push stream updates from the upstream to the local controller
        cacheStreamController = entry.updateStreamController.stream.listen(
          localStreamController.add,
          onDone: () => unawaited(localStreamController.close()),
        );

        final currentData = entry.value;
        if (currentData != null && !force) {
          // If we have a cached value at call time, and we're not using legacy `force` behavior, immediately emit that value
          localStreamController.add(currentData);
        }

        if (currentData == null || force) {
          // No data/force request, request new data from upstream
          unawaited(
            _fetchDeduped(
              key,
            ).catchError((Object error, StackTrace stack) => localStreamController.addError(error, stack)),
          );
        }
      },
      onCancel: () async {
        await cacheStreamController?.cancel();

        final entry = _entries[key];
        if (entry == null) {
          return;
        }

        if (entry.deref().refCount <= 0) {
          _entries.remove(key);
        }
      },
    );

    return localStreamController.stream;
  }

  /// Apply [transform] to all values corresponding to keys matching [predicate]
  ///
  /// Returning the same value (identity) from [transform] will not emit a new value
  void update(bool Function(K key) predicate, V Function(V value) transform) {
    for (final MapEntry(:key, value: entry) in _entries.entries) {
      if (!predicate(key)) {
        continue;
      }

      final currentValue = entry.value;
      if (currentValue == null) {
        continue;
      }

      final newValue = transform(currentValue);
      if (!identical(newValue, currentValue)) {
        entry.value = newValue;
      }
    }
  }

  /// Close all streams and delete caches
  Future<void> dispose() async {
    _inflightFetches.clear();

    final oldEntries = [..._entries.values];
    _entries.clear();

    await Future.wait(oldEntries.map((entry) => entry.updateStreamController.close()));
  }

  /// Fetch a single value matching the provided [key]. If a matching fetch is already in progress, await that fetch
  Future<void> _fetchDeduped(K key) {
    return _inflightFetches.putIfAbsent(key, () async {
      try {
        final data = await _fetch(key);
        final entry = _entries[key];

        if (entry != null) {
          entry.value = data;
        }
      } finally {
        unawaited(_inflightFetches.remove(key));
      }
    });
  }
}

/// A streaming in memory cache entry
class _CacheEntry<V> {
  V? _value;
  int refCount = 0;

  final StreamController<V> updateStreamController = StreamController.broadcast();

  /// The current value in the cache
  V? get value => _value;

  /// Set the current cache value, sending it to all subscribers
  set value(V newValue) {
    _value = newValue;
    updateStreamController.add(newValue);
  }

  /// Increments the reference count of the entry
  _CacheEntry<V> ref() {
    refCount += 1;
    return this;
  }

  /// Decrements the reference count of the entry. If there are no active references, closes the update stream
  _CacheEntry<V> deref() {
    if (refCount == 0) {
      unawaited(updateStreamController.close());

      return this;
    }

    refCount -= 1;
    return this;
  }
}
