import 'dart:async';

import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';

/// Provides access to a persistent key-value store with an in-memory cache.
/// Listens for repository changes to keep the cache updated.
class StoreService {
  final IStoreRepository _storeRepository;

  /// In-memory cache. Keys are [StoreKey.id]
  final Map<int, Object?> _cache = {};
  late final StreamSubscription<StoreDto> _storeUpdateSubscription;

  StoreService._({required IStoreRepository storeRepository})
      : _storeRepository = storeRepository;

  // TODO: Temporary typedef to make minimal changes. Remove this and make the presentation layer access store through a provider
  static StoreService? _instance;
  static StoreService get I {
    if (_instance == null) {
      throw UnsupportedError("StoreService not initialized. Call init() first");
    }
    return _instance!;
  }

  // TODO: Replace the implementation with the one from create after removing the typedef
  static Future<StoreService> init({
    required IStoreRepository storeRepository,
  }) async {
    _instance ??= await create(storeRepository: storeRepository);
    return _instance!;
  }

  static Future<StoreService> create({
    required IStoreRepository storeRepository,
  }) async {
    final instance = StoreService._(storeRepository: storeRepository);
    await instance._populateCache();
    instance._storeUpdateSubscription = instance._listenForChange();
    return instance;
  }

  Future<void> _populateCache() async {
    final storeValues = await _storeRepository.getAll();
    for (StoreDto storeValue in storeValues) {
      _cache[storeValue.key.id] = storeValue.value;
    }
  }

  StreamSubscription<StoreDto> _listenForChange() =>
      _storeRepository.watchAll().listen((event) {
        _cache[event.key.id] = event.value;
      });

  /// Disposes the store and cancels the subscription. To reuse the store call init() again
  void dispose() async {
    await _storeUpdateSubscription.cancel();
    _cache.clear();
  }

  /// Returns the cached value for [key], or `null`
  T? tryGet<T>(StoreKey<T> key) => _cache[key.id] as T?;

  /// Returns the stored value for [key] or [defaultValue].
  /// Throws [StoreKeyNotFoundException] if value and [defaultValue] are null.
  T get<T>(StoreKey<T> key, [T? defaultValue]) {
    final value = tryGet(key) ?? defaultValue;
    if (value == null) {
      throw StoreKeyNotFoundException(key);
    }
    return value;
  }

  /// Stores the [value] for the [key]. Skips write if value hasn't changed.
  Future<void> put<U extends StoreKey<T>, T>(U key, T value) async {
    if (_cache[key.id] == value) return;
    await _storeRepository.insert(key, value);
    _cache[key.id] = value;
  }

  /// Returns a stream that emits the value for [key] on change.
  Stream<T?> watch<T>(StoreKey<T> key) => _storeRepository.watch(key);

  /// Removes the value for [key]
  Future<void> delete<T>(StoreKey<T> key) async {
    await _storeRepository.delete(key);
    _cache.remove(key.id);
  }

  /// Clears all values from thw store (cache and DB)
  Future<void> clear() async {
    await _storeRepository.deleteAll();
    _cache.clear();
  }
}

class StoreKeyNotFoundException implements Exception {
  final StoreKey key;
  const StoreKeyNotFoundException(this.key);

  @override
  String toString() => "Key - <${key.name}> not available in Store";
}
