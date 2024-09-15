import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/store.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class StoreDriftRepository with LogContext implements IStoreRepository {
  final DriftDatabaseRepository _db;

  const StoreDriftRepository(this._db);

  @override
  FutureOr<T?> tryGet<T, U>(StoreKey<T, U> key) async {
    final storeData = await _db.managers.store
        .filter((s) => s.id.equals(key.id))
        .getSingleOrNull();
    return _getValueFromStoreData(key, storeData);
  }

  @override
  FutureOr<T> get<T, U>(StoreKey<T, U> key) async {
    final value = await tryGet(key);
    if (value == null) {
      throw StoreKeyNotFoundException(key);
    }
    return value;
  }

  @override
  FutureOr<bool> set<T, U>(StoreKey<T, U> key, T value) async {
    try {
      final storeValue = key.converter.toPrimitive(value);
      final intValue = (key.type == int) ? storeValue as int : null;
      final stringValue = (key.type == String) ? storeValue as String : null;
      await _db.into(_db.store).insertOnConflictUpdate(StoreCompanion.insert(
            id: Value(key.id),
            intValue: Value(intValue),
            stringValue: Value(stringValue),
          ));
      return true;
    } catch (e, s) {
      log.severe("Cannot set store value - ${key.name}; id - ${key.id}", e, s);
      return false;
    }
  }

  @override
  FutureOr<void> delete(StoreKey key) async {
    await _db.managers.store.filter((s) => s.id.equals(key.id)).delete();
  }

  @override
  Stream<T?> watch<T, U>(StoreKey<T, U> key) {
    return _db.managers.store
        .filter((s) => s.id.equals(key.id))
        .watchSingleOrNull()
        .asyncMap((e) async => await _getValueFromStoreData(key, e));
  }

  @override
  FutureOr<void> clearStore() async {
    await _db.managers.store.delete();
  }

  FutureOr<T?> _getValueFromStoreData<T, U>(
    StoreKey<T, U> key,
    StoreData? data,
  ) async {
    final primitive = switch (key.type) {
      const (int) => data?.intValue,
      const (String) => data?.stringValue,
      _ => null,
    } as U?;
    if (primitive != null) {
      return await key.converter.fromPrimitive(primitive);
    }
    return null;
  }
}
