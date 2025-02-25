import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';

abstract interface class IStoreRepository implements IDatabaseRepository {
  Future<bool> insert<T>(StoreKey<T> key, T value);

  Future<T?> tryGet<T>(StoreKey<T> key);

  Stream<T?> watch<T>(StoreKey<T> key);

  Stream<StoreUpdateEvent> watchAll();

  Future<bool> update<T>(StoreKey<T> key, T value);

  Future<void> delete<T>(StoreKey<T> key);

  Future<void> deleteAll();
}
