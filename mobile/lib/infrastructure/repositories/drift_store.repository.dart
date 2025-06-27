import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/drift_user.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftStoreRepositoryProvider = Provider<DriftStoreRepository>(
  (ref) => DriftStoreRepository(ref.watch(driftProvider)),
);

class DriftStoreRepository implements IStoreRepository {
  final Drift _db;
  final validStoreKeys = StoreKey.values.map((e) => e.id).toSet();

  DriftStoreRepository(this._db);

  @override
  Future<bool> deleteAll() async {
    return await _db.transaction(() async {
      await _db.delete(_db.storeEntity).go();
      return true;
    });
  }

  @override
  Stream<StoreDto<Object>> watchAll() {
    return (_db.select(_db.storeEntity)
          ..where((tbl) => tbl.id.isIn(validStoreKeys)))
        .watch()
        .asyncExpand(
          (entities) => Stream.fromFutures(
            entities.map((e) async => _toUpdateEvent(e)),
          ),
        );
  }

  @override
  Future<void> delete<T>(StoreKey<T> key) async {
    return await _db.transaction(() async {
      await (_db.delete(_db.storeEntity)..where((tbl) => tbl.id.equals(key.id)))
          .go();
    });
  }

  @override
  Future<bool> insert<T>(StoreKey<T> key, T value) async {
    return await _db.transaction(() async {
      await _db
          .into(_db.storeEntity)
          .insertOnConflictUpdate(await _fromValue(key, value));
      return true;
    });
  }

  @override
  Future<T?> tryGet<T>(StoreKey<T> key) async {
    final entity = await (_db.select(_db.storeEntity)
          ..where((tbl) => tbl.id.equals(key.id)))
        .getSingleOrNull();
    if (entity == null) {
      return null;
    }
    return await _toValue(key, entity);
  }

  @override
  Future<bool> update<T>(StoreKey<T> key, T value) async {
    return await _db.transaction(() async {
      await _db
          .into(_db.storeEntity)
          .insertOnConflictUpdate(await _fromValue(key, value));
      return true;
    });
  }

  @override
  Stream<T?> watch<T>(StoreKey<T> key) async* {
    yield* (_db.select(_db.storeEntity)..where((tbl) => tbl.id.equals(key.id)))
        .watchSingleOrNull()
        .asyncMap((e) async => e == null ? null : await _toValue(key, e));
  }

  Future<StoreDto<Object>> _toUpdateEvent(StoreEntityData entity) async {
    final key = StoreKey.values.firstWhere((e) => e.id == entity.id)
        as StoreKey<Object>;
    final value = await _toValue(key, entity);
    return StoreDto(key, value);
  }

  Future<T?> _toValue<T>(StoreKey<T> key, StoreEntityData entity) async =>
      switch (key.type) {
        const (int) => entity.intValue,
        const (String) => entity.strValue,
        const (bool) => entity.intValue == 1,
        const (DateTime) => entity.intValue == null
            ? null
            : DateTime.fromMillisecondsSinceEpoch(entity.intValue!),
        const (UserDto) => entity.strValue == null
            ? null
            : await DriftUserRepository(_db).getByUserId(entity.strValue!),
        _ => null,
      } as T?;

  Future<StoreEntityData> _fromValue<T>(StoreKey<T> key, T value) async {
    final (int? intValue, String? strValue) = switch (key.type) {
      const (int) => (value as int, null),
      const (String) => (null, value as String),
      const (bool) => ((value as bool) ? 1 : 0, null),
      const (DateTime) => ((value as DateTime).millisecondsSinceEpoch, null),
      const (UserDto) => (
          null,
          (await DriftUserRepository(_db).update(value as UserDto)).id,
        ),
      _ => throw UnsupportedError(
          "Unsupported primitive type: ${key.type} for key: ${key.name}",
        ),
    };
    return StoreEntityData(
      id: key.id,
      intValue: intValue,
      strValue: strValue,
    );
  }

  @override
  Future<List<StoreDto<Object>>> getAll() async {
    final entities = await (_db.select(_db.storeEntity)
          ..where((tbl) => tbl.id.isIn(validStoreKeys)))
        .get();
    return Future.wait(entities.map((e) => _toUpdateEvent(e)).toList());
  }
}

abstract class IStoreRepository {
  Future<bool> deleteAll();
  Stream<StoreDto<Object>> watchAll();
  Future<void> delete<T>(StoreKey<T> key);
  Future<bool> insert<T>(StoreKey<T> key, T value);
  Future<T?> tryGet<T>(StoreKey<T> key);
  Future<bool> update<T>(StoreKey<T> key, T value);
  Stream<T?> watch<T>(StoreKey<T> key);
  Future<List<StoreDto<Object>>> getAll();
}
