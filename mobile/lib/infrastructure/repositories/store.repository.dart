import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:isar/isar.dart';

// Temporary interface until Isar is removed to make the service work with both Isar and Sqlite
abstract class IStoreRepository {
  Future<bool> deleteAll();
  Stream<List<StoreDto<Object>>> watchAll();
  Future<void> delete<T>(StoreKey<T> key);
  Future<bool> upsert<T>(StoreKey<T> key, T value);
  Future<T?> tryGet<T>(StoreKey<T> key);
  Stream<T?> watch<T>(StoreKey<T> key);
  Future<List<StoreDto<Object>>> getAll();
}

class IsarStoreRepository extends IsarDatabaseRepository implements IStoreRepository {
  final Isar _db;
  final validStoreKeys = StoreKey.values.map((e) => e.id).toSet();

  IsarStoreRepository(super.db) : _db = db;

  @override
  Future<bool> deleteAll() async {
    return await transaction(() async {
      await _db.storeValues.clear();
      return true;
    });
  }

  @override
  Stream<List<StoreDto<Object>>> watchAll() {
    return _db.storeValues
        .filter()
        .anyOf(validStoreKeys, (query, id) => query.idEqualTo(id))
        .watch(fireImmediately: true)
        .asyncMap((entities) => Future.wait(entities.map((entity) => _toUpdateEvent(entity))));
  }

  @override
  Future<void> delete<T>(StoreKey<T> key) async {
    return await transaction(() async => await _db.storeValues.delete(key.id));
  }

  @override
  Future<bool> upsert<T>(StoreKey<T> key, T value) async {
    return await transaction(() async {
      await _db.storeValues.put(await _fromValue(key, value));
      return true;
    });
  }

  @override
  Future<T?> tryGet<T>(StoreKey<T> key) async {
    final entity = (await _db.storeValues.get(key.id));
    if (entity == null) {
      return null;
    }
    return await _toValue(key, entity);
  }

  @override
  Stream<T?> watch<T>(StoreKey<T> key) async* {
    yield* _db.storeValues
        .watchObject(key.id, fireImmediately: true)
        .asyncMap((e) async => e == null ? null : await _toValue(key, e));
  }

  Future<StoreDto<Object>> _toUpdateEvent(StoreValue entity) async {
    final key = StoreKey.values.firstWhere((e) => e.id == entity.id) as StoreKey<Object>;
    final value = await _toValue(key, entity);
    return StoreDto(key, value);
  }

  Future<T?> _toValue<T>(StoreKey<T> key, StoreValue entity) async =>
      switch (key.type) {
            const (int) => entity.intValue,
            const (String) => entity.strValue,
            const (bool) => entity.intValue == 1,
            const (DateTime) => entity.intValue == null ? null : DateTime.fromMillisecondsSinceEpoch(entity.intValue!),
            const (UserDto) =>
              entity.strValue == null ? null : await IsarUserRepository(_db).getByUserId(entity.strValue!),
            _ => null,
          }
          as T?;

  Future<StoreValue> _fromValue<T>(StoreKey<T> key, T value) async {
    final (int? intValue, String? strValue) = switch (key.type) {
      const (int) => (value as int, null),
      const (String) => (null, value as String),
      const (bool) => ((value as bool) ? 1 : 0, null),
      const (DateTime) => ((value as DateTime).millisecondsSinceEpoch, null),
      const (UserDto) => (null, (await IsarUserRepository(_db).update(value as UserDto)).id),
      _ => throw UnsupportedError("Unsupported primitive type: ${key.type} for key: ${key.name}"),
    };
    return StoreValue(key.id, intValue: intValue, strValue: strValue);
  }

  @override
  Future<List<StoreDto<Object>>> getAll() async {
    final entities = await _db.storeValues.filter().anyOf(validStoreKeys, (query, id) => query.idEqualTo(id)).findAll();
    return Future.wait(entities.map((e) => _toUpdateEvent(e)).toList());
  }
}

class DriftStoreRepository extends DriftDatabaseRepository implements IStoreRepository {
  final Drift _db;
  final validStoreKeys = StoreKey.values.map((e) => e.id).toSet();

  DriftStoreRepository(super.db) : _db = db;

  @override
  Future<bool> deleteAll() async {
    await _db.storeEntity.deleteAll();
    return true;
  }

  @override
  Future<List<StoreDto<Object>>> getAll() async {
    final query = _db.storeEntity.select()..where((entity) => entity.id.isIn(validStoreKeys));
    return query.asyncMap((entity) => _toUpdateEvent(entity)).get();
  }

  @override
  Stream<List<StoreDto<Object>>> watchAll() {
    final query = _db.storeEntity.select()..where((entity) => entity.id.isIn(validStoreKeys));

    return query.asyncMap((entity) => _toUpdateEvent(entity)).watch();
  }

  @override
  Future<void> delete<T>(StoreKey<T> key) async {
    await _db.storeEntity.deleteWhere((entity) => entity.id.equals(key.id));
    return;
  }

  @override
  Future<bool> upsert<T>(StoreKey<T> key, T value) async {
    await _db.storeEntity.insertOnConflictUpdate(await _fromValue(key, value));
    return true;
  }

  @override
  Future<T?> tryGet<T>(StoreKey<T> key) async {
    final entity = await _db.managers.storeEntity.filter((entity) => entity.id.equals(key.id)).getSingleOrNull();
    if (entity == null) {
      return null;
    }
    return await _toValue(key, entity);
  }

  @override
  Stream<T?> watch<T>(StoreKey<T> key) async* {
    final query = _db.storeEntity.select()..where((entity) => entity.id.equals(key.id));

    yield* query.watchSingleOrNull().asyncMap((e) async => e == null ? null : await _toValue(key, e));
  }

  Future<StoreDto<Object>> _toUpdateEvent(StoreEntityData entity) async {
    final key = StoreKey.values.firstWhere((e) => e.id == entity.id) as StoreKey<Object>;
    final value = await _toValue(key, entity);
    return StoreDto(key, value);
  }

  Future<T?> _toValue<T>(StoreKey<T> key, StoreEntityData entity) async =>
      switch (key.type) {
            const (int) => entity.intValue,
            const (String) => entity.stringValue,
            const (bool) => entity.intValue == 1,
            const (DateTime) => entity.intValue == null ? null : DateTime.fromMillisecondsSinceEpoch(entity.intValue!),
            const (UserDto) =>
              entity.stringValue == null ? null : await DriftAuthUserRepository(_db).get(entity.stringValue!),
            _ => null,
          }
          as T?;

  Future<StoreEntityCompanion> _fromValue<T>(StoreKey<T> key, T value) async {
    final (int? intValue, String? strValue) = switch (key.type) {
      const (int) => (value as int, null),
      const (String) => (null, value as String),
      const (bool) => ((value as bool) ? 1 : 0, null),
      const (DateTime) => ((value as DateTime).millisecondsSinceEpoch, null),
      const (UserDto) => (null, (await DriftAuthUserRepository(_db).upsert(value as UserDto)).id),
      _ => throw UnsupportedError("Unsupported primitive type: ${key.type} for key: ${key.name}"),
    };
    return StoreEntityCompanion(id: Value(key.id), intValue: Value(intValue), stringValue: Value(strValue));
  }
}
