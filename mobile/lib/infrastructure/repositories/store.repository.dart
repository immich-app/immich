import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/database.repository.dart';
import 'package:isar/isar.dart';

class IsarStoreRepository extends IsarDatabaseRepository
    implements IStoreRepository {
  final Isar _db;
  const IsarStoreRepository(super.db) : _db = db;

  @override
  Future<bool> deleteAll() async {
    return await nestTxn(() async {
      await _db.store.clear();
      return true;
    });
  }

  @override
  Stream<StoreUpdateEvent> watchAll() {
    return _db.store
        .where()
        .watch()
        .expand((entities) => entities.map((e) => e.toUpdateEvent()));
  }

  @override
  Future<void> delete<T>(StoreKey<T> key) async {
    return await nestTxn(() async => await _db.store.delete(key.id));
  }

  @override
  Future<bool> insert<T>(StoreKey<T> key, T value) async {
    return await nestTxn(() async {
      await _db.store.put(StoreEntity.fromValue(key, value));
      return true;
    });
  }

  @override
  Future<T?> tryGet<T>(StoreKey<T> key) async {
    return (await _db.store.get(key.id))?.toValue(key);
  }

  @override
  Future<bool> update<T>(StoreKey<T> key, T value) async {
    return await nestTxn(() async {
      await _db.store.put(StoreEntity.fromValue(key, value));
      return true;
    });
  }

  @override
  Stream<T?> watch<T>(StoreKey<T> key) async* {
    yield* _db.store
        .watchObject(key.id, fireImmediately: true)
        .asyncMap((e) => e?.toValue(key));
  }
}
