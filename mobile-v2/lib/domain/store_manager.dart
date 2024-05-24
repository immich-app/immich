import 'dart:async';

import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class StoreKeyNotFoundException implements Exception {
  final StoreKey key;
  const StoreKeyNotFoundException(this.key);

  @override
  String toString() => "Key '${key.name}' not found in Store";
}

/// Key-value cache for individual items enumerated in StoreKey.
class StoreManager with LogContext {
  late final IStoreRepository _db;
  late final StreamSubscription _subscription;
  final Map<int, dynamic> _cache = {};

  StoreManager(IStoreRepository db) {
    _db = db;
    _subscription = _db.watchStore().listen(_onChangeListener);
    _populateCache();
  }

  void dispose() {
    _subscription.cancel();
  }

  FutureOr<void> _populateCache() async {
    for (StoreKey key in StoreKey.values) {
      final value = await _db.getValue(key);
      if (value != null) {
        _cache[key.id] = value;
      }
    }

    /// Signal ready once the cache is populated
    di.signalReady(this);
  }

  /// clears all values from this store (cache and DB), only for testing!
  Future<void> clear() async {
    _cache.clear();
    return await _db.clearStore();
  }

  /// Returns the stored value for the given key (possibly null)
  T? tryGet<T, U>(StoreKey<T, U> key) => _cache[key.id] as T?;

  /// Returns the stored value for the given key or if null the [defaultValue]
  /// Throws a [StoreKeyNotFoundException] if both are null
  T get<T, U>(StoreKey<T, U> key, [T? defaultValue]) {
    final value = _cache[key.id] ?? defaultValue;
    if (value == null) {
      throw StoreKeyNotFoundException(key);
    }
    return value;
  }

  /// Watches a specific key for changes
  Stream<T?> watch<T, U>(StoreKey<T, U> key) => _db.watchValue(key);

  /// Stores the value synchronously in the cache and asynchronously in the DB
  FutureOr<bool> put<T, U>(StoreKey<T, U> key, T value) async {
    if (_cache[key.id] == value) return Future.value(true);
    _cache[key.id] = value;
    return await _db.setValue(key, value);
  }

  /// Removes the value synchronously from the cache and asynchronously from the DB
  Future<void> delete<T, U>(StoreKey<T, U> key) async {
    if (_cache[key.id] == null) return Future.value();
    _cache.remove(key.id);
    return await _db.deleteValue(key);
  }

  /// Updates the state in cache if a value is updated in any isolate
  void _onChangeListener(List<StoreValue>? data) {
    if (data != null) {
      for (StoreValue storeValue in data) {
        if (storeValue.value != null) {
          _cache[storeValue.id] = storeValue.value;
        }
      }
    }
  }
}
