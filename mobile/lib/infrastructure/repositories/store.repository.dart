import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/app/store.drift.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';

@DriftAccessor()
class StoreRepository extends DatabaseAccessor<Drift> with $StoreRepositoryMixin {
  final validStoreKeys = StoreKey.values.map((e) => e.id).toSet();

  StoreRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<bool> deleteAll() async {
    await _db.storeEntity.deleteAll();
    return true;
  }

  Future<List<StoreDto<Object>>> getAll() async {
    final query = _db.storeEntity.select()..where((entity) => entity.id.isIn(validStoreKeys));
    return query.asyncMap((entity) => _toUpdateEvent(entity)).get();
  }

  Stream<List<StoreDto<Object>>> watchAll() {
    final query = _db.storeEntity.select()..where((entity) => entity.id.isIn(validStoreKeys));

    return query.asyncMap((entity) => _toUpdateEvent(entity)).watch();
  }

  Future<void> deleteValue<T>(StoreKey<T> key) async {
    await _db.storeEntity.deleteWhere((entity) => entity.id.equals(key.id));
    return;
  }

  Future<bool> upsert<T>(StoreKey<T> key, T value) async {
    await _db.storeEntity.insertOnConflictUpdate(await _fromValue(key, value));
    return true;
  }

  Future<T?> tryGet<T>(StoreKey<T> key) async {
    final entity = await _db.managers.storeEntity.filter((entity) => entity.id.equals(key.id)).getSingleOrNull();
    if (entity == null) {
      return null;
    }
    return await _toValue(key, entity);
  }

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
              entity.stringValue == null ? null : await AuthUserRepository(_db).get(entity.stringValue!),
            _ => null,
          }
          as T?;

  Future<StoreEntityCompanion> _fromValue<T>(StoreKey<T> key, T value) async {
    final (int? intValue, String? strValue) = switch (key.type) {
      const (int) => (value as int, null),
      const (String) => (null, value as String),
      const (bool) => ((value as bool) ? 1 : 0, null),
      const (DateTime) => ((value as DateTime).millisecondsSinceEpoch, null),
      const (UserDto) => (null, (await AuthUserRepository(_db).upsert(value as UserDto)).id),
      _ => throw UnsupportedError("Unsupported primitive type: ${key.type} for key: ${key.name}"),
    };
    return StoreEntityCompanion(id: Value(key.id), intValue: Value(intValue), stringValue: Value(strValue));
  }
}
