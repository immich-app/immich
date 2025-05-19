import 'dart:async';

import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';

class StoreService {
  final IStoreRepository _storeRepository;

  final Map<int, dynamic> _cache = {};
  late final StreamSubscription<StoreUpdateEvent> _storeUpdateSubscription;

  StoreService._({
    required IStoreRepository storeRepository,
  }) : _storeRepository = storeRepository;

  // TODO: Temporary typedef to make minimal changes. Remove this and make the presentation layer access store through a provider
  static StoreService? _instance;
  static StoreService get I {
    if (_instance == null) {
      throw UnsupportedError("StoreService not initialized. Call init() first");
    }
    return _instance!;
  }

  // TODO: Replace the implementation with the one from create after removing the typedef
  /// Initializes the store with the given [storeRepository]
  static Future<StoreService> init({
    required IStoreRepository storeRepository,
  }) async {
    _instance ??= await create(storeRepository: storeRepository);
    return _instance!;
  }

  /// Initializes the store with the given [storeRepository]
  static Future<StoreService> create({
    required IStoreRepository storeRepository,
  }) async {
    final instance = StoreService._(storeRepository: storeRepository);
    await instance._populateCache();
    instance._storeUpdateSubscription = instance._listenForChange();
    return instance;
  }

  /// Fills the cache with the values from the DB
  Future<void> _populateCache() async {
    for (StoreKey key in StoreKey.values) {
      final storeValue = await _storeRepository.tryGet(key);
      _cache[key.id] = storeValue;
    }
  }

  /// Listens for changes in the DB and updates the cache
  StreamSubscription<StoreUpdateEvent> _listenForChange() =>
      _storeRepository.watchAll().listen((event) {
        _cache[event.key.id] = event.value;
      });

  /// Disposes the store and cancels the subscription. To reuse the store call init() again
  void dispose() async {
    await _storeUpdateSubscription.cancel();
    _cache.clear();
  }

  /// Returns the stored value for the given key (possibly null)
  T? tryGet<T>(StoreKey<T> key) => _cache[key.id];

  /// Returns the stored value for the given key or if null the [defaultValue]
  /// Throws a [StoreKeyNotFoundException] if both are null
  T get<T>(StoreKey<T> key, [T? defaultValue]) {
    final value = tryGet(key) ?? defaultValue;
    if (value == null) {
      throw StoreKeyNotFoundException(key);
    }
    return value;
  }

  /// Asynchronously stores the value in the Store
  Future<void> put<U extends StoreKey<T>, T>(U key, T value) async {
    if (_cache[key.id] == value) return;
    await _storeRepository.insert(key, value);
    _cache[key.id] = value;
  }

  /// Watches a specific key for changes
  Stream<T?> watch<T>(StoreKey<T> key) => _storeRepository.watch(key);

  /// Removes the value asynchronously from the Store
  Future<void> delete<T>(StoreKey<T> key) async {
    await _storeRepository.delete(key);
    _cache.remove(key.id);
  }

  /// Clears all values from this store (cache and DB)
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
