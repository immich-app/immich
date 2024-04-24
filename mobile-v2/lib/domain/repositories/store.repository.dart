import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/store.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';

class StoreDriftRepository implements IStoreRepository {
  final DriftDatabaseRepository db;

  const StoreDriftRepository(this.db);

  @override
  FutureOr<T?> getValue<T>(StoreKey key) async {
    final value = await db.managers.store
        .filter((s) => s.id.equals(key.id))
        .getSingleOrNull();
    return value?.toModel().extract(key.type);
  }

  @override
  FutureOr<void> setValue<T>(StoreKey<T> key, T value) {
    return db.transaction(() async {
      final storeValue = StoreValue.of(key, value);
      await db.into(db.store).insertOnConflictUpdate(StoreCompanion.insert(
            id: Value(storeValue.id),
            intValue: Value(storeValue.intValue),
            stringValue: Value(storeValue.stringValue),
          ));
    });
  }

  @override
  FutureOr<void> deleteValue(StoreKey key) {
    return db.transaction(() async {
      await db.managers.store.filter((s) => s.id.equals(key.id)).delete();
    });
  }

  @override
  Stream<List<StoreValue>> watchStore() {
    return (db.select(db.store).map((s) => s.toModel())).watch();
  }

  @override
  Stream<T?> watchValue<T>(StoreKey key) {
    return db.managers.store
        .filter((s) => s.id.equals(key.id))
        .watchSingleOrNull()
        .map((e) => e?.toModel().extract(key.type));
  }

  @override
  FutureOr<void> clearStore() {
    return db.transaction(() async {
      await db.managers.store.delete();
    });
  }
}

extension _StoreDataToStoreValue on StoreData {
  StoreValue toModel() {
    return StoreValue(id: id, intValue: intValue, stringValue: stringValue);
  }
}
