import 'dart:async';

import 'package:immich_mobile/domain/exceptions/store.exception.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';

// TODO: Temporary typedef to make minimal changes. Remove this and make the presentation layer access store through a provider
// ignore: non_constant_identifier_names
final StoreService Store = StoreService.I;

class StoreService {
  final IStoreRepository _storeRepo;
  final Map<int, dynamic> _cache = {};
  late final StreamSubscription<StoreUpdateEvent> _subscription;

  StoreService._(IStoreRepository storeRepo) : _storeRepo = storeRepo;

  // TODO: Temporary typedef to make minimal changes. Remove this and make the presentation layer access store through a provider
  static StoreService? _instance;
  static StoreService get I {
    if (_instance == null) {
      throw const StoreUnInitializedException();
    }
    return _instance!;
  }

  /// Initializes the store with the given [storeRepository]
  static Future<StoreService> init(IStoreRepository storeRepository) async {
    if (_instance != null) {
      return _instance!;
    }
    _instance = StoreService._(storeRepository);
    await _instance!._populateCache();
    _instance!._subscription = _instance!._listenForChange();
    return _instance!;
  }

  /// Fills the cache with the values from the DB
  Future<void> _populateCache() async {
    for (StoreKey key in StoreKey.values) {
      final storeValue = await _storeRepo.tryGet(key);
      _cache[key.id] = storeValue;
    }
  }

  /// Listens for changes in the DB and updates the cache
  StreamSubscription<StoreUpdateEvent> _listenForChange() =>
      _storeRepo.watchAll().listen((event) {
        _cache[event.key.id] = event.value;
      });

  /// Disposes the store and cancels the subscription. To reuse the store call init() again
  void dispose() async {
    await _subscription.cancel();
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

  /// Asynchronously stores the value in the DB and synchronously in the cache
  Future<void> put<T>(StoreKey<T> key, T value) async {
    if (_cache[key.id] == value) return;
    await _storeRepo.insert(key, value);
    _cache[key.id] = value;
  }

  /// Watches a specific key for changes
  Stream<T?> watch<T>(StoreKey<T> key) => _storeRepo.watch(key);

  /// Removes the value asynchronously from the DB and synchronously from the cache
  Future<void> delete<T>(StoreKey<T> key) async {
    await _storeRepo.delete(key);
    _cache.remove(key.id);
  }

  /// Clears all values from this store (cache and DB)
  Future<void> clear() async {
    await _storeRepo.deleteAll();
    _cache.clear();
  }
}
