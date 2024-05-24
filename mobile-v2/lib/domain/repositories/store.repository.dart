import 'dart:async';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/store.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class StoreDriftRepository with LogContext implements IStoreRepository {
  final DriftDatabaseRepository db;

  const StoreDriftRepository(this.db);

  @override
  FutureOr<T?> getValue<T, U>(StoreKey<T, U> key) async {
    final storeData = await db.managers.store
        .filter((s) => s.id.equals(key.id))
        .getSingleOrNull();
    return _getValueFromStoreData(key, storeData);
  }

  @override
  FutureOr<bool> setValue<T, U>(StoreKey<T, U> key, T value) async {
    try {
      await db.transaction(() async {
        final storeValue = key.converter.toPrimitive(value);
        final intValue = (key.type == int) ? storeValue as int : null;
        final stringValue = (key.type == String) ? storeValue as String : null;
        await db.into(db.store).insertOnConflictUpdate(StoreCompanion.insert(
              id: Value(key.id),
              intValue: Value(intValue),
              stringValue: Value(stringValue),
            ));
      });
      return true;
    } catch (e, s) {
      log.severe("Cannot set store value - ${key.name}; id - ${key.id}", e, s);
      return false;
    }
  }

  @override
  FutureOr<void> deleteValue(StoreKey key) async {
    return await db.transaction(() async {
      await db.managers.store.filter((s) => s.id.equals(key.id)).delete();
    });
  }

  @override
  Stream<List<StoreValue>> watchStore() {
    return (db.select(db.store).map((s) {
      final key = StoreKey.values.firstWhereOrNull((e) => e.id == s.id);
      if (key != null) {
        final value = _getValueFromStoreData(key, s);
        return StoreValue(id: s.id, value: value);
      }
      return StoreValue(id: s.id, value: null);
    })).watch();
  }

  @override
  Stream<T?> watchValue<T, U>(StoreKey<T, U> key) {
    return db.managers.store
        .filter((s) => s.id.equals(key.id))
        .watchSingleOrNull()
        .map((e) => _getValueFromStoreData(key, e));
  }

  @override
  FutureOr<void> clearStore() async {
    return await db.transaction(() async {
      await db.managers.store.delete();
    });
  }

  T? _getValueFromStoreData<T, U>(StoreKey<T, U> key, StoreData? data) {
    final primitive = switch (key.type) {
      const (int) => data?.intValue,
      const (String) => data?.stringValue,
      _ => null,
    } as U?;
    if (primitive != null) {
      return key.converter.fromPrimitive(primitive);
    }
    return null;
  }
}
