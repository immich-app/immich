import 'package:immich_mobile/entities/store.entity.dart';

abstract interface class IStoreRepository {
  Future<bool> insert<T>(StoreKey<T> key, T value);

  Future<T?> tryGet<T>(StoreKey<T> key);

  Stream<T?> watch<T>(StoreKey<T> key);

  Stream<StoreUpdateEvent> watchAll();

  Future<bool> update<T>(StoreKey<T> key, T value);

  Future<void> delete<T>(StoreKey<T> key);

  Future<void> deleteAll();
}
